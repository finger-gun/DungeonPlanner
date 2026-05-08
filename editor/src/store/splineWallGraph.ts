import { getContentPackAssetById } from '../content-packs/registry'
import { GRID_SIZE } from '../hooks/useSnapToGrid'
import { getOpeningSegments } from './openingSegments'
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
    const { startRatio, endRatio, bottomHeight, topHeight } = getSplineWallOpeningCutoutSpec(opening)

    getSplineWallOpeningCutoutPlacements(nextGraph, opening, startRatio, endRatio).forEach((placement) => {
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

function getSplineWallOpeningCutoutPlacements(
  graph: SplineWallGraph,
  opening: OpeningRecord,
  openingStartRatio: number,
  openingEndRatio: number,
) {
  return getOpeningSegments(opening.wallKey, opening.width)
    .flatMap((wallKey) => {
      const directPlacements = Object.values(graph.segments)
        .filter((segment) => segment.wallKey === wallKey)
        .map((segment) => ({
          segmentId: segment.id,
          startRatio: openingStartRatio,
          endRatio: openingEndRatio,
        }))
      if (directPlacements.length > 0) {
        return directPlacements
      }

      const boundary = getWallKeyBoundary(wallKey)
      if (!boundary) {
        return []
      }

      return Object.values(graph.segments)
        .flatMap((segment) => projectWallKeyOpeningOntoSplineSegment(
          graph,
          segment,
          boundary,
          openingStartRatio,
          openingEndRatio,
        ))
    })
}

function getWallKeyBoundary(wallKey: string) {
  const [cellXText, cellZText, direction] = wallKey.split(':')
  const cellX = Number.parseInt(cellXText ?? '', 10)
  const cellZ = Number.parseInt(cellZText ?? '', 10)
  if (!Number.isFinite(cellX) || !Number.isFinite(cellZ)) {
    return null
  }

  switch (direction) {
    case 'north':
      return { start: [cellX, cellZ + 1] as [number, number], end: [cellX + 1, cellZ + 1] as [number, number] }
    case 'south':
      return { start: [cellX, cellZ] as [number, number], end: [cellX + 1, cellZ] as [number, number] }
    case 'east':
      return { start: [cellX + 1, cellZ] as [number, number], end: [cellX + 1, cellZ + 1] as [number, number] }
    case 'west':
      return { start: [cellX, cellZ] as [number, number], end: [cellX, cellZ + 1] as [number, number] }
    default:
      return null
  }
}

function projectWallKeyOpeningOntoSplineSegment(
  graph: SplineWallGraph,
  segment: SplineWallSegment,
  boundary: { start: [number, number]; end: [number, number] },
  openingStartRatio: number,
  openingEndRatio: number,
) {
  const start = graph.nodes[segment.startNodeId]?.position
  const end = graph.nodes[segment.endNodeId]?.position
  if (!start || !end) {
    return []
  }

  const segmentDeltaX = end[0] - start[0]
  const segmentDeltaZ = end[1] - start[1]
  const boundaryDeltaX = boundary.end[0] - boundary.start[0]
  const boundaryDeltaZ = boundary.end[1] - boundary.start[1]
  const segmentIsHorizontal = Math.abs(segmentDeltaZ) <= SPLINE_WALL_CUTOUT_EPSILON
  const segmentIsVertical = Math.abs(segmentDeltaX) <= SPLINE_WALL_CUTOUT_EPSILON
  const boundaryIsHorizontal = Math.abs(boundaryDeltaZ) <= SPLINE_WALL_CUTOUT_EPSILON
  const boundaryIsVertical = Math.abs(boundaryDeltaX) <= SPLINE_WALL_CUTOUT_EPSILON

  if (
    (!segmentIsHorizontal && !segmentIsVertical)
    || segmentIsHorizontal !== boundaryIsHorizontal
    || segmentIsVertical !== boundaryIsVertical
  ) {
    return []
  }

  if (segmentIsHorizontal && Math.abs(start[1] - boundary.start[1]) > SPLINE_WALL_CUTOUT_EPSILON) {
    return []
  }
  if (segmentIsVertical && Math.abs(start[0] - boundary.start[0]) > SPLINE_WALL_CUTOUT_EPSILON) {
    return []
  }

  const boundaryStartRatio = projectPointOntoSegmentRatio(boundary.start, start, end)
  const boundaryEndRatio = projectPointOntoSegmentRatio(boundary.end, start, end)
  const overlapStartRatio = Math.max(0, Math.min(boundaryStartRatio, boundaryEndRatio))
  const overlapEndRatio = Math.min(1, Math.max(boundaryStartRatio, boundaryEndRatio))
  if (overlapEndRatio - overlapStartRatio <= SPLINE_WALL_CUTOUT_EPSILON) {
    return []
  }

  const segmentOverlapStart = interpolateSplineWallPoint(start, end, overlapStartRatio)
  const segmentOverlapEnd = interpolateSplineWallPoint(start, end, overlapEndRatio)
  const overlapBoundaryStart = projectPointOntoSegmentRatio(segmentOverlapStart, boundary.start, boundary.end)
  const overlapBoundaryEnd = projectPointOntoSegmentRatio(segmentOverlapEnd, boundary.start, boundary.end)
  const cutoutBoundaryStart = Math.max(openingStartRatio, Math.min(overlapBoundaryStart, overlapBoundaryEnd))
  const cutoutBoundaryEnd = Math.min(openingEndRatio, Math.max(overlapBoundaryStart, overlapBoundaryEnd))
  if (cutoutBoundaryEnd - cutoutBoundaryStart <= SPLINE_WALL_CUTOUT_EPSILON) {
    return []
  }

  const cutoutStart = interpolateSplineWallPoint(boundary.start, boundary.end, cutoutBoundaryStart)
  const cutoutEnd = interpolateSplineWallPoint(boundary.start, boundary.end, cutoutBoundaryEnd)
  const cutoutStartRatio = projectPointOntoSegmentRatio(cutoutStart, start, end)
  const cutoutEndRatio = projectPointOntoSegmentRatio(cutoutEnd, start, end)

  return [{
    segmentId: segment.id,
    startRatio: Math.max(0, Math.min(cutoutStartRatio, cutoutEndRatio)),
    endRatio: Math.min(1, Math.max(cutoutStartRatio, cutoutEndRatio)),
  }]
}

function getSplineWallOpeningCutoutSpec(opening: OpeningRecord) {
  if (opening.assetId === null || opening.width !== 1) {
    return { startRatio: 0, endRatio: 1, bottomHeight: 0, topHeight: null }
  }

  const asset = getContentPackAssetById(opening.assetId)
  const clearWidth = asset?.metadata?.openingCutoutWidth
  const clearHeight = asset?.metadata?.openingCutoutHeight
  if (clearWidth === undefined) {
    return { startRatio: 0, endRatio: 1, bottomHeight: 0, topHeight: clearHeight ?? null }
  }

  const clampedWidth = Math.min(Math.max(clearWidth, SPLINE_WALL_CUTOUT_EPSILON), GRID_SIZE)
  if (clampedWidth >= GRID_SIZE - SPLINE_WALL_CUTOUT_EPSILON) {
    return { startRatio: 0, endRatio: 1, bottomHeight: 0, topHeight: clearHeight ?? null }
  }

  const insetRatio = (GRID_SIZE - clampedWidth) / (GRID_SIZE * 2)
  return {
    startRatio: insetRatio,
    endRatio: 1 - insetRatio,
    bottomHeight: 0,
    topHeight: clearHeight ?? null,
  }
}

const SPLINE_WALL_CUTOUT_EPSILON = 1e-5

function interpolateSplineWallPoint(
  start: [number, number],
  end: [number, number],
  ratio: number,
): [number, number] {
  return [
    start[0] + ((end[0] - start[0]) * ratio),
    start[1] + ((end[1] - start[1]) * ratio),
  ]
}

function projectPointOntoSegmentRatio(
  point: [number, number],
  start: [number, number],
  end: [number, number],
) {
  const deltaX = end[0] - start[0]
  const deltaZ = end[1] - start[1]
  const lengthSquared = deltaX * deltaX + deltaZ * deltaZ
  if (lengthSquared <= SPLINE_WALL_CUTOUT_EPSILON) {
    return 0
  }

  return (((point[0] - start[0]) * deltaX) + ((point[1] - start[1]) * deltaZ)) / lengthSquared
}

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
