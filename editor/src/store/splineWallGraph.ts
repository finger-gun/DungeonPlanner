import {
  getOpeningSpanPlacements,
  getOpeningVerticalCutoutSpec,
} from './openingPlacement'
import type { RoomDraftCornerMode, RoomDraftSplineNodeInput } from './roomDraft'
import type { OpeningRecord } from './useDungeonStore'

export type SplineWallNode = {
  id: string
  position: [number, number]
  layerId: string
  roomId: string | null
  cornerMode?: RoomDraftCornerMode | null
  cornerAmount?: number | null
}

export type SplineWallCutoutKind = 'door' | 'passage' | 'window'

export type SplineWallCutout = {
  id: string
  kind: SplineWallCutoutKind
  startRatio: number
  endRatio: number
  bottomHeight: number
  topHeight: number | null
  assetId: string | null
  openingId: string | null
  objectProps: Record<string, unknown>
}

export type SplineWallSegment = {
  id: string
  pathId: string
  startNodeId: string
  endNodeId: string
  layerId: string
  roomId: string | null
  wallKey: string | null
  wallHeight: number | null
  wallThickness: number | null
  cutouts: SplineWallCutout[]
}

export type SplineWallPath = {
  id: string
  layerId: string
  roomId: string | null
  closed: boolean
  nodeIds: string[]
  segmentIds: string[]
}

export type SplineWallGraph = {
  nodes: Record<string, SplineWallNode>
  segments: Record<string, SplineWallSegment>
  paths: Record<string, SplineWallPath>
}

export type PaintedCellLike = {
  cell: [number, number]
  layerId: string
  roomId: string | null
}

export type PaintedCellsLike = Record<string, PaintedCellLike>

export type UpsertSplineWallGraphRoomPathInput = {
  roomId: string
  layerId: string
  nodes: RoomDraftSplineNodeInput[]
  closed?: boolean
}

export function createEmptySplineWallGraph(): SplineWallGraph {
  return {
    nodes: {},
    segments: {},
    paths: {},
  }
}

export const EMPTY_SPLINE_WALL_GRAPH = Object.freeze(createEmptySplineWallGraph())

export function cloneSplineWallGraph(graph: SplineWallGraph | null | undefined): SplineWallGraph {
  if (!graph) {
    return createEmptySplineWallGraph()
  }

  return {
    nodes: Object.fromEntries(
      Object.entries(graph.nodes).map(([id, node]) => [
        id,
        {
          ...node,
          position: [...node.position] as SplineWallNode['position'],
        },
      ]),
    ),
    segments: Object.fromEntries(
      Object.entries(graph.segments).map(([id, segment]) => [
        id,
        {
          ...segment,
          cutouts: segment.cutouts.map((cutout) => ({
            ...cutout,
            objectProps: { ...cutout.objectProps },
          })),
        },
      ]),
    ),
    paths: Object.fromEntries(
      Object.entries(graph.paths).map(([id, path]) => [
        id,
        {
          ...path,
          nodeIds: [...path.nodeIds],
          segmentIds: [...path.segmentIds],
        },
      ]),
    ),
  }
}

export function hasSplineWallGraphPaths(graph: SplineWallGraph | null | undefined) {
  return Object.keys(graph?.paths ?? {}).length > 0
}

export function upsertSplineWallGraphRoomPath(
  graph: SplineWallGraph,
  input: UpsertSplineWallGraphRoomPathInput,
): SplineWallGraph {
  if (input.nodes.length < 2) {
    return cloneSplineWallGraph(graph)
  }

  const nextGraph = cloneSplineWallGraph(graph)
  const roomPathIds = Object.values(nextGraph.paths)
    .filter((path) => path.roomId === input.roomId)
    .map((path) => path.id)
  roomPathIds.forEach((pathId) => deleteSplineWallGraphPath(nextGraph, pathId))

  const pathId = `${input.roomId}:path:0`
  const nodeIds = input.nodes.map((_, index) => `${pathId}:node:${index}`)
  const closed = input.closed ?? true
  const segmentCount = closed ? input.nodes.length : input.nodes.length - 1
  const segmentIds = Array.from({ length: segmentCount }, (_, index) => `${pathId}:segment:${index}`)

  input.nodes.forEach((node, index) => {
    nextGraph.nodes[nodeIds[index]!] = {
      id: nodeIds[index]!,
      position: [...node.position] as [number, number],
      layerId: input.layerId,
      roomId: input.roomId,
      cornerMode: node.cornerMode,
      cornerAmount: node.cornerAmount,
    }
  })

  segmentIds.forEach((segmentId, index) => {
    const startNodeId = nodeIds[index]!
    const endNodeId = closed
      ? nodeIds[(index + 1) % input.nodes.length]!
      : nodeIds[index + 1]!

    nextGraph.segments[segmentId] = {
      id: segmentId,
      pathId,
      startNodeId,
      endNodeId,
      layerId: input.layerId,
      roomId: input.roomId,
      wallKey: null,
      wallHeight: null,
      wallThickness: null,
      cutouts: [],
    }
  })

  nextGraph.paths[pathId] = {
    id: pathId,
    layerId: input.layerId,
    roomId: input.roomId,
    closed,
    nodeIds,
    segmentIds,
  }

  return nextGraph
}

export function pruneSplineWallGraphRooms(
  graph: SplineWallGraph,
  validRoomIds: ReadonlySet<string>,
): SplineWallGraph {
  const nextGraph = cloneSplineWallGraph(graph)

  Object.values(nextGraph.paths)
    .filter((path) => path.roomId !== null && !validRoomIds.has(path.roomId))
    .forEach((path) => deleteSplineWallGraphPath(nextGraph, path.id))

  return nextGraph
}

export function getSplineWallSegmentMidpoint(
  graph: SplineWallGraph,
  segmentId: string,
): [number, number] | null {
  const segment = graph.segments[segmentId]
  if (!segment) {
    return null
  }

  const start = graph.nodes[segment.startNodeId]?.position
  const end = graph.nodes[segment.endNodeId]?.position
  if (!start || !end) {
    return null
  }

  return [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
  ]
}

export function splitSplineWallGraphSegment(
  graph: SplineWallGraph,
  segmentId: string,
  position?: [number, number],
): SplineWallGraph | null {
  const segment = graph.segments[segmentId]
  if (!segment) {
    return null
  }

  const path = graph.paths[segment.pathId]
  if (!path) {
    return null
  }

  const start = graph.nodes[segment.startNodeId]
  const end = graph.nodes[segment.endNodeId]
  if (!start || !end) {
    return null
  }

  const segmentIndex = path.segmentIds.indexOf(segmentId)
  if (segmentIndex < 0) {
    return null
  }

  const nextGraph = cloneSplineWallGraph(graph)
  const nextPath = nextGraph.paths[path.id]
  const nextSegment = nextGraph.segments[segmentId]
  if (!nextPath || !nextSegment) {
    return null
  }

  const midpoint = position ?? getSplineWallSegmentMidpoint(graph, segmentId)
  if (!midpoint) {
    return null
  }

  const nodePrefix = `${path.id}:node:split`
  const segmentPrefix = `${path.id}:segment:split`
  const nextNodeId = createSplineWallGraphEntityId(nextGraph.nodes, nodePrefix)
  const nextSegmentId = createSplineWallGraphEntityId(nextGraph.segments, segmentPrefix)
  const nextNode = {
    id: nextNodeId,
    position: [...midpoint] as [number, number],
    layerId: segment.layerId,
    roomId: segment.roomId,
  } satisfies SplineWallNode

  nextGraph.nodes[nextNodeId] = nextNode
  const splitRatio = getSplineWallSegmentSplitRatio(start.position, end.position, midpoint)
  const [nextSegmentCutouts, splitSegmentCutouts] = splitSplineWallGraphCutouts(nextSegment.cutouts, splitRatio)
  nextSegment.endNodeId = nextNodeId
  nextSegment.cutouts = nextSegmentCutouts
  nextPath.nodeIds.splice(segmentIndex + 1, 0, nextNodeId)

  nextGraph.segments[nextSegmentId] = {
    ...segment,
    id: nextSegmentId,
    startNodeId: nextNodeId,
    endNodeId: segment.endNodeId,
    cutouts: splitSegmentCutouts,
  }
  nextPath.segmentIds.splice(segmentIndex + 1, 0, nextSegmentId)

  return nextGraph
}

export function removeSplineWallGraphNode(
  graph: SplineWallGraph,
  nodeId: string,
): SplineWallGraph | null {
  const path = Object.values(graph.paths).find((entry) => entry.nodeIds.includes(nodeId))
  if (!path) {
    return null
  }

  const nodeIndex = path.nodeIds.indexOf(nodeId)
  if (nodeIndex < 0) {
    return null
  }

  const nextGraph = cloneSplineWallGraph(graph)
  const nextPath = nextGraph.paths[path.id]
  if (!nextPath) {
    return null
  }

  if (nextPath.closed) {
    if (nextPath.nodeIds.length <= 3) {
      return null
    }

    const previousSegmentIndex = ((nodeIndex - 1) + nextPath.segmentIds.length) % nextPath.segmentIds.length
    const nextSegmentIndex = nodeIndex % nextPath.segmentIds.length
    const previousSegmentId = nextPath.segmentIds[previousSegmentIndex]
    const nextSegmentId = nextPath.segmentIds[nextSegmentIndex]
    const previousSegment = previousSegmentId ? nextGraph.segments[previousSegmentId] : null
    const nextSegment = nextSegmentId ? nextGraph.segments[nextSegmentId] : null
    if (!previousSegment || !nextSegment) {
      return null
    }

    previousSegment.cutouts = mergeSplineWallGraphCutouts(
      previousSegment.cutouts,
      nextSegment.cutouts,
      distanceBetweenSplineWallNodes(nextGraph.nodes[previousSegment.startNodeId]?.position, graph.nodes[nodeId]?.position),
      distanceBetweenSplineWallNodes(graph.nodes[nodeId]?.position, nextGraph.nodes[nextSegment.endNodeId]?.position),
    )
    previousSegment.endNodeId = nextSegment.endNodeId
    if (!previousSegment.wallKey && nextSegment.wallKey) {
      previousSegment.wallKey = nextSegment.wallKey
    }
    delete nextGraph.segments[nextSegment.id]
    nextPath.segmentIds.splice(nextSegmentIndex, 1)
    nextPath.nodeIds.splice(nodeIndex, 1)
    delete nextGraph.nodes[nodeId]
    return nextGraph
  }

  if (nextPath.nodeIds.length <= 2) {
    return null
  }

  if (nodeIndex === 0) {
    const nextSegmentId = nextPath.segmentIds[0]
    if (!nextSegmentId) {
      return null
    }
    delete nextGraph.segments[nextSegmentId]
    nextPath.segmentIds.splice(0, 1)
    nextPath.nodeIds.splice(0, 1)
    delete nextGraph.nodes[nodeId]
    return nextGraph
  }

  if (nodeIndex === nextPath.nodeIds.length - 1) {
    const previousSegmentIndex = nextPath.segmentIds.length - 1
    const previousSegmentId = nextPath.segmentIds[previousSegmentIndex]
    if (!previousSegmentId) {
      return null
    }
    delete nextGraph.segments[previousSegmentId]
    nextPath.segmentIds.splice(previousSegmentIndex, 1)
    nextPath.nodeIds.splice(nodeIndex, 1)
    delete nextGraph.nodes[nodeId]
    return nextGraph
  }

  const previousSegmentIndex = nodeIndex - 1
  const nextSegmentIndex = nodeIndex
  const previousSegmentId = nextPath.segmentIds[previousSegmentIndex]
  const nextSegmentId = nextPath.segmentIds[nextSegmentIndex]
  const previousSegment = previousSegmentId ? nextGraph.segments[previousSegmentId] : null
  const nextSegment = nextSegmentId ? nextGraph.segments[nextSegmentId] : null
  if (!previousSegment || !nextSegment) {
    return null
  }

  previousSegment.cutouts = mergeSplineWallGraphCutouts(
    previousSegment.cutouts,
    nextSegment.cutouts,
    distanceBetweenSplineWallNodes(nextGraph.nodes[previousSegment.startNodeId]?.position, graph.nodes[nodeId]?.position),
    distanceBetweenSplineWallNodes(graph.nodes[nodeId]?.position, nextGraph.nodes[nextSegment.endNodeId]?.position),
  )
  previousSegment.endNodeId = nextSegment.endNodeId
  if (!previousSegment.wallKey && nextSegment.wallKey) {
    previousSegment.wallKey = nextSegment.wallKey
  }
  delete nextGraph.segments[nextSegment.id]
  nextPath.segmentIds.splice(nextSegmentIndex, 1)
  nextPath.nodeIds.splice(nodeIndex, 1)
  delete nextGraph.nodes[nodeId]

  return nextGraph
}

function createSplineWallGraphEntityId<T extends { id: string }>(
  entries: Record<string, T>,
  prefix: string,
) {
  let index = 1
  let nextId = `${prefix}:${index}`
  while (entries[nextId]) {
    index += 1
    nextId = `${prefix}:${index}`
  }
  return nextId
}

function deleteSplineWallGraphPath(graph: SplineWallGraph, pathId: string) {
  const path = graph.paths[pathId]
  if (!path) {
    return
  }

  path.segmentIds.forEach((segmentId) => {
    delete graph.segments[segmentId]
  })
  path.nodeIds.forEach((nodeId) => {
    delete graph.nodes[nodeId]
  })
  delete graph.paths[pathId]
}

export function syncSplineWallGraphCutoutsFromOpenings(
  graph: SplineWallGraph,
  wallOpenings: Record<string, OpeningRecord>,
): SplineWallGraph {
  const nextGraph = cloneSplineWallGraph(graph)
  const cutoutsBySegmentId = new Map<string, SplineWallCutout[]>()

  Object.values(wallOpenings).forEach((opening) => {
    const kind: SplineWallCutoutKind = opening.assetId === null ? 'passage' : 'door'
    const { bottomHeight, topHeight } = getOpeningVerticalCutoutSpec(opening)

    getOpeningSpanPlacements(nextGraph, opening).forEach((placement) => {
      const nextCutout = {
        id: `${opening.id}:${placement.segmentId}`,
        kind,
        startRatio: placement.startRatio,
        endRatio: placement.endRatio,
        bottomHeight,
        topHeight,
        assetId: opening.assetId,
        openingId: opening.id,
        objectProps: { ...(opening.objectProps ?? {}) },
      } satisfies SplineWallCutout

      const existing = cutoutsBySegmentId.get(placement.segmentId)
      if (existing) {
        existing.push(nextCutout)
      } else {
        cutoutsBySegmentId.set(placement.segmentId, [nextCutout])
      }
    })
  })

  Object.values(nextGraph.segments).forEach((segment) => {
    const preservedCutouts = segment.cutouts.filter((cutout) => cutout.openingId === null)
    const derivedCutouts = cutoutsBySegmentId.get(segment.id) ?? []
    segment.cutouts = [
      ...preservedCutouts,
      ...derivedCutouts.map((cutout) => ({
        ...cutout,
        objectProps: { ...cutout.objectProps },
      })),
    ]
  })

  return nextGraph
}

const SPLINE_WALL_CUTOUT_EPSILON = 1e-5

function getSplineWallSegmentSplitRatio(
  start: [number, number],
  end: [number, number],
  split: [number, number],
) {
  const deltaX = end[0] - start[0]
  const deltaZ = end[1] - start[1]
  const lengthSquared = deltaX * deltaX + deltaZ * deltaZ
  if (lengthSquared <= SPLINE_WALL_CUTOUT_EPSILON) {
    return 0.5
  }

  const ratio = ((split[0] - start[0]) * deltaX + (split[1] - start[1]) * deltaZ) / lengthSquared
  return Math.min(Math.max(ratio, SPLINE_WALL_CUTOUT_EPSILON), 1 - SPLINE_WALL_CUTOUT_EPSILON)
}

function splitSplineWallGraphCutouts(
  cutouts: SplineWallCutout[],
  splitRatio: number,
): [SplineWallCutout[], SplineWallCutout[]] {
  const startCutouts: SplineWallCutout[] = []
  const endCutouts: SplineWallCutout[] = []

  cutouts.forEach((cutout) => {
    const startRatio = Math.min(cutout.startRatio, cutout.endRatio)
    const endRatio = Math.max(cutout.startRatio, cutout.endRatio)

    if (startRatio < splitRatio - SPLINE_WALL_CUTOUT_EPSILON) {
      startCutouts.push({
        ...cutout,
        id: endRatio > splitRatio + SPLINE_WALL_CUTOUT_EPSILON ? `${cutout.id}:start` : cutout.id,
        startRatio: startRatio / splitRatio,
        endRatio: Math.min(endRatio, splitRatio) / splitRatio,
        objectProps: { ...cutout.objectProps },
      })
    }

    if (endRatio > splitRatio + SPLINE_WALL_CUTOUT_EPSILON) {
      endCutouts.push({
        ...cutout,
        id: startRatio < splitRatio - SPLINE_WALL_CUTOUT_EPSILON ? `${cutout.id}:end` : cutout.id,
        startRatio: (Math.max(startRatio, splitRatio) - splitRatio) / (1 - splitRatio),
        endRatio: (endRatio - splitRatio) / (1 - splitRatio),
        objectProps: { ...cutout.objectProps },
      })
    }
  })

  return [startCutouts, endCutouts]
}

function mergeSplineWallGraphCutouts(
  startCutouts: SplineWallCutout[],
  endCutouts: SplineWallCutout[],
  startLength: number,
  endLength: number,
) {
  const totalLength = startLength + endLength
  if (totalLength <= SPLINE_WALL_CUTOUT_EPSILON) {
    return [...startCutouts, ...endCutouts].map((cutout) => ({
      ...cutout,
      objectProps: { ...cutout.objectProps },
    }))
  }

  const startScale = startLength / totalLength
  const endScale = endLength / totalLength
  const merged = [
    ...startCutouts.map((cutout) => ({
      ...cutout,
      startRatio: cutout.startRatio * startScale,
      endRatio: cutout.endRatio * startScale,
      objectProps: { ...cutout.objectProps },
    })),
    ...endCutouts.map((cutout) => ({
      ...cutout,
      startRatio: startScale + cutout.startRatio * endScale,
      endRatio: startScale + cutout.endRatio * endScale,
      objectProps: { ...cutout.objectProps },
    })),
  ].sort((left, right) => left.startRatio - right.startRatio)

  return merged.reduce<SplineWallCutout[]>((acc, cutout) => {
    const previous = acc.at(-1)
    if (
      previous
      && previous.kind === cutout.kind
      && previous.assetId === cutout.assetId
      && previous.openingId === cutout.openingId
      && JSON.stringify(previous.objectProps) === JSON.stringify(cutout.objectProps)
      && Math.abs(previous.endRatio - cutout.startRatio) <= SPLINE_WALL_CUTOUT_EPSILON
    ) {
      previous.endRatio = cutout.endRatio
      return acc
    }

    acc.push(cutout)
    return acc
  }, [])
}

function distanceBetweenSplineWallNodes(
  start: [number, number] | undefined,
  end: [number, number] | undefined,
) {
  if (!start || !end) {
    return 0
  }

  return Math.hypot(end[0] - start[0], end[1] - start[1])
}
