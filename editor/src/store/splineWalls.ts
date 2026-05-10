import { GRID_SIZE, getCellKey } from '../hooks/useSnapToGrid'
import {
  createEmptySplineWallGraph,
  type PaintedCellsLike,
  type SplineWallGraph,
} from './splineWallGraph'

export type SplineBoundaryPoint = readonly [number, number]
export type SplineMaskWorldPoint = readonly [number, number]

export type QuadraticBezierFrame2D = {
  position: SplineBoundaryPoint
  tangent: SplineBoundaryPoint
  normal: SplineBoundaryPoint
}

export type RoomSplineWallChain = {
  roomId: string
  wallKeys: string[]
  points: SplineBoundaryPoint[]
  closed: boolean
  cornerStyles?: Array<RoomSplineWallCornerStyle | undefined>
  wallBaseHeight?: number
  wallHeight?: number
}

export type SplineWallGeometryOptions = {
  wallHeight?: number
  wallThickness?: number
  cornerRadius?: number
  curveSubdivisions?: number
  uvScale?: number
}

export type SplineWallGeometryData = {
  positions: Float32Array
  normals: Float32Array
  uvs: Float32Array
  indices: Uint32Array
}

export type RoomSplineWallMeshData = SplineWallGeometryData & {
  roomId: string
}

export type SampledSplineWallFrame = {
  position: SplineBoundaryPoint
  tangent: SplineBoundaryPoint
  normal: SplineBoundaryPoint
  distance: number
  offsetScale: number
}

type BoundaryEdge = {
  roomId: string
  wallKey: string
  start: SplineBoundaryPoint
  end: SplineBoundaryPoint
}

type WorldPoint = readonly [number, number]

type RoomSplineWallCornerStyle = {
  mode: 'square' | 'rounded' | 'diagonal'
  amount: number
}

type SplineWallSharedSuppressedInterval = readonly [number, number]

type StraightSplineWallSegmentReference = {
  segmentId: string
  roomId: string | null
  start: WorldPoint
  end: WorldPoint
  tangent: WorldPoint
}

type SampledSplineWallSharedEdge = {
  segmentId: string
  roomId: string | null
  startRatio: number
  endRatio: number
}

// Match the scaled KayKit dungeon wall asset bounds (wall.glb at 0.5 scale):
// 2.0 world units tall and 0.5 world units thick.
export const DEFAULT_SPLINE_WALL_HEIGHT = 2.0
export const DEFAULT_SPLINE_WALL_THICKNESS = 0.5
const DEFAULT_CORNER_RADIUS = GRID_SIZE * 0.35
const DEFAULT_CURVE_SUBDIVISIONS = 6
export const DEFAULT_SPLINE_WALL_UV_SCALE = GRID_SIZE
export const SPLINE_WALL_GEOMETRY_EPSILON = 1e-5
const MAX_SPLINE_WALL_MITER_SCALE = 2
const SAMPLED_SPLINE_WALL_KEY_SCALE = 100000

export function evaluateQuadraticBezierPoint(
  start: SplineBoundaryPoint,
  control: SplineBoundaryPoint,
  end: SplineBoundaryPoint,
  t: number,
): SplineBoundaryPoint {
  const oneMinusT = 1 - t
  const x =
    oneMinusT * oneMinusT * start[0]
    + 2 * oneMinusT * t * control[0]
    + t * t * end[0]
  const y =
    oneMinusT * oneMinusT * start[1]
    + 2 * oneMinusT * t * control[1]
    + t * t * end[1]
  return [x, y]
}

export function evaluateQuadraticBezierFrame(
  start: SplineBoundaryPoint,
  control: SplineBoundaryPoint,
  end: SplineBoundaryPoint,
  t: number,
): QuadraticBezierFrame2D {
  const position = evaluateQuadraticBezierPoint(start, control, end, t)
  const tangent = normalizePoint([
    2 * (1 - t) * (control[0] - start[0]) + 2 * t * (end[0] - control[0]),
    2 * (1 - t) * (control[1] - start[1]) + 2 * t * (end[1] - control[1]),
  ])
  return {
    position,
    tangent,
    normal: perpendicularPoint(tangent),
  }
}

export function buildRoomSplineWallChains(
  paintedCells: PaintedCellsLike,
  suppressedWallKeys: ReadonlySet<string> = new Set(),
  roomIds: ReadonlySet<string> | null = null,
): RoomSplineWallChain[] {
  const targetRoomIds = roomIds
    ? [...roomIds]
    : [...new Set(
        Object.values(paintedCells)
          .map((record) => record.roomId)
          .filter((roomId): roomId is string => typeof roomId === 'string' && roomId.length > 0),
      )]

  return targetRoomIds.flatMap((roomId) => {
    const edges = collectRoomBoundaryEdges(roomId, paintedCells)
      .filter((edge) => !suppressedWallKeys.has(edge.wallKey))

    return traceBoundaryChains(edges)
  })
}

export function buildSplineWallGraphFromPaintedCells(
  paintedCells: PaintedCellsLike,
  suppressedWallKeys: ReadonlySet<string> = new Set(),
): SplineWallGraph {
  const graph = createEmptySplineWallGraph()
  const chains = buildRoomSplineWallChains(paintedCells, suppressedWallKeys)
  const chainCountByRoom = new Map<string, number>()

  chains.forEach((chain) => {
    const roomChainIndex = chainCountByRoom.get(chain.roomId) ?? 0
    chainCountByRoom.set(chain.roomId, roomChainIndex + 1)

    const layerId = getRoomLayerId(chain.roomId, paintedCells)
    const pathId = `${chain.roomId}:path:${roomChainIndex}`
    const nodeIds = chain.points.map((point, index) => {
      const nodeId = `${pathId}:node:${index}`
      graph.nodes[nodeId] = {
        id: nodeId,
        position: [...point] as [number, number],
        layerId,
        roomId: chain.roomId,
      }
      return nodeId
    })

    const segmentCount = chain.closed ? nodeIds.length : nodeIds.length - 1
    const segmentIds: string[] = []
    for (let index = 0; index < segmentCount; index += 1) {
      const segmentId = `${pathId}:segment:${index}`
      graph.segments[segmentId] = {
        id: segmentId,
        pathId,
        startNodeId: nodeIds[index]!,
        endNodeId: nodeIds[(index + 1) % nodeIds.length]!,
        layerId,
        roomId: chain.roomId,
        wallKey: chain.wallKeys[index] ?? null,
        wallHeight: null,
        wallThickness: null,
        cutouts: [],
      }
      segmentIds.push(segmentId)
    }

    graph.paths[pathId] = {
      id: pathId,
      layerId,
      roomId: chain.roomId,
      closed: chain.closed,
      nodeIds,
      segmentIds,
    }
  })

  return graph
}

export function buildRoomSplineWallChainsFromGraph(
  splineWallGraph: SplineWallGraph,
  visibleLayerIds: ReadonlySet<string> | null = null,
  suppressedWallKeys: ReadonlySet<string> = new Set(),
  roomIds: ReadonlySet<string> | null = null,
  defaultWallHeight: number = DEFAULT_SPLINE_WALL_HEIGHT,
  respectCutouts: boolean = true,
  geometryOptions: SplineWallGeometryOptions = {},
): RoomSplineWallChain[] {
  const sharedSegmentGroups = buildSharedSplineWallSegmentGroups(
    splineWallGraph,
    visibleLayerIds,
  )
  const sharedSuppressedIntervals = buildSharedSplineWallSegmentOverlapIntervals(
    splineWallGraph,
    visibleLayerIds,
    geometryOptions,
  )
  return Object.values(splineWallGraph.paths)
    .filter((path) =>
      (!visibleLayerIds || visibleLayerIds.has(path.layerId))
      && (!roomIds || (path.roomId !== null && roomIds.has(path.roomId))))
    .flatMap((path) => buildPathSplineWallChains(
      path,
      splineWallGraph,
      suppressedWallKeys,
      defaultWallHeight,
      respectCutouts,
      sharedSegmentGroups,
      sharedSuppressedIntervals,
    ))
}

export function buildRoomSplineWallMeshes(
  paintedCells: PaintedCellsLike,
  suppressedWallKeys: ReadonlySet<string> = new Set(),
  options: SplineWallGeometryOptions = {},
  roomIds: ReadonlySet<string> | null = null,
): RoomSplineWallMeshData[] {
  const chains = buildRoomSplineWallChains(paintedCells, suppressedWallKeys, roomIds)
  return buildRoomSplineWallMeshesFromChains(chains, options)
}

export function buildRoomSplineWallMeshesFromGraph(
  splineWallGraph: SplineWallGraph,
  visibleLayerIds: ReadonlySet<string> | null = null,
  suppressedWallKeys: ReadonlySet<string> = new Set(),
  roomIds: ReadonlySet<string> | null = null,
  options: SplineWallGeometryOptions = {},
): RoomSplineWallMeshData[] {
  const chains = buildRoomSplineWallChainsFromGraph(
    splineWallGraph,
    visibleLayerIds,
    suppressedWallKeys,
    roomIds,
    options.wallHeight ?? DEFAULT_SPLINE_WALL_HEIGHT,
    true,
    options,
  )
  return buildRoomSplineWallMeshesFromChains(chains, options)
}

export function buildSplineWallMaskPathFromGraph(
  path: SplineWallGraph['paths'][string],
  splineWallGraph: SplineWallGraph,
  options: SplineWallGeometryOptions = {},
): SplineMaskWorldPoint[] {
  if (!path.closed || path.nodeIds.length < 3) {
    return []
  }

  return buildSampledSplineWallPathFromGraph(path, splineWallGraph, options)
}

export function buildSampledSplineWallPathFromGraph(
  path: SplineWallGraph['paths'][string],
  splineWallGraph: SplineWallGraph,
  options: SplineWallGeometryOptions = {},
): SplineMaskWorldPoint[] {
  if (path.nodeIds.length < 2) {
    return []
  }

  const points: SplineBoundaryPoint[] = []
  path.nodeIds.forEach((nodeId) => {
    const point = splineWallGraph.nodes[nodeId]?.position
    if (point) {
      points.push(point)
    }
  })
  const minimumPointCount = path.closed ? 3 : 2
  if (points.length < minimumPointCount) {
    return []
  }

  return buildSampledBoundaryPath({
    roomId: path.roomId ?? path.id,
    wallKeys: path.segmentIds,
    points,
    closed: path.closed,
    cornerStyles: path.nodeIds.map((nodeId) => getSplineWallNodeCornerStyle(splineWallGraph.nodes[nodeId])),
  }, options)
}

function buildRoomSplineWallMeshesFromChains(
  chains: readonly RoomSplineWallChain[],
  options: SplineWallGeometryOptions = {},
): RoomSplineWallMeshData[] {
  const chainsByRoom = new Map<string, RoomSplineWallChain[]>()

  chains.forEach((chain) => {
    const bucket = chainsByRoom.get(chain.roomId)
    if (bucket) {
      bucket.push(chain)
      return
    }
    chainsByRoom.set(chain.roomId, [chain])
  })

  return [...chainsByRoom.entries()]
    .map(([roomId, roomChains]) => ({
      roomId,
      ...mergeSplineWallGeometryData(roomChains.map((chain) => buildSplineWallGeometryData(chain, options))),
    }))
    .filter((mesh) => mesh.indices.length > 0)
}

export function buildSplineWallGeometryData(
  chain: RoomSplineWallChain,
  options: SplineWallGeometryOptions = {},
): SplineWallGeometryData {
  const frames = buildSampledSplineWallFrames(chain, options)
  if (frames.length < 2) {
    return createEmptySplineWallGeometryData()
  }

  const wallBaseHeight = chain.wallBaseHeight ?? 0
  const wallHeight = chain.wallHeight ?? options.wallHeight ?? DEFAULT_SPLINE_WALL_HEIGHT
  const wallTopHeight = wallBaseHeight + wallHeight
  const wallThickness = options.wallThickness ?? DEFAULT_SPLINE_WALL_THICKNESS
  const uvScale = Math.max(options.uvScale ?? DEFAULT_SPLINE_WALL_UV_SCALE, SPLINE_WALL_GEOMETRY_EPSILON)
  const halfThickness = wallThickness / 2
  const wallBaseV = wallBaseHeight / uvScale
  const wallTopV = wallTopHeight / uvScale

  const positions: number[] = []
  const normalsArray: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  const appendQuad = (
    a: readonly [number, number, number],
    b: readonly [number, number, number],
    c: readonly [number, number, number],
    d: readonly [number, number, number],
    normalA: readonly [number, number, number],
    normalB: readonly [number, number, number],
    normalC: readonly [number, number, number],
    normalD: readonly [number, number, number],
    uvA: readonly [number, number],
    uvB: readonly [number, number],
    uvC: readonly [number, number],
    uvD: readonly [number, number],
  ) => {
    const baseIndex = positions.length / 3
    positions.push(...a, ...b, ...c, ...d)
    normalsArray.push(...normalA, ...normalB, ...normalC, ...normalD)
    uvs.push(...uvA, ...uvB, ...uvC, ...uvD)
    indices.push(
      baseIndex + 0,
      baseIndex + 2,
      baseIndex + 1,
      baseIndex + 1,
      baseIndex + 2,
      baseIndex + 3,
    )
  }

  const segmentCount = chain.closed ? frames.length : frames.length - 1
  for (let index = 0; index < segmentCount; index += 1) {
    const currentIndex = index
    const nextIndex = (index + 1) % frames.length
    const currentFrame = frames[currentIndex]
    const nextFrame = frames[nextIndex]
    if (!currentFrame || !nextFrame) {
      continue
    }
    const currentPoint = currentFrame.position
    const nextPoint = nextFrame.position
    const currentNormal = currentFrame.normal
    const nextNormal = nextFrame.normal
    const segmentLength = distanceBetweenPoints(currentPoint, nextPoint)
    if (segmentLength <= SPLINE_WALL_GEOMETRY_EPSILON) {
      continue
    }

    const leftBottomCurrent = toWorldVertex(currentPoint, currentNormal, -halfThickness * currentFrame.offsetScale, wallBaseHeight)
    const leftTopCurrent = toWorldVertex(currentPoint, currentNormal, -halfThickness * currentFrame.offsetScale, wallTopHeight)
    const rightBottomCurrent = toWorldVertex(currentPoint, currentNormal, halfThickness * currentFrame.offsetScale, wallBaseHeight)
    const rightTopCurrent = toWorldVertex(currentPoint, currentNormal, halfThickness * currentFrame.offsetScale, wallTopHeight)
    const leftBottomNext = toWorldVertex(nextPoint, nextNormal, -halfThickness * nextFrame.offsetScale, wallBaseHeight)
    const leftTopNext = toWorldVertex(nextPoint, nextNormal, -halfThickness * nextFrame.offsetScale, wallTopHeight)
    const rightBottomNext = toWorldVertex(nextPoint, nextNormal, halfThickness * nextFrame.offsetScale, wallBaseHeight)
    const rightTopNext = toWorldVertex(nextPoint, nextNormal, halfThickness * nextFrame.offsetScale, wallTopHeight)
    const outerNormalCurrent: [number, number, number] = [currentNormal[0], 0, currentNormal[1]]
    const outerNormalNext: [number, number, number] = [nextNormal[0], 0, nextNormal[1]]
    const innerNormalCurrent: [number, number, number] = [-currentNormal[0], 0, -currentNormal[1]]
    const innerNormalNext: [number, number, number] = [-nextNormal[0], 0, -nextNormal[1]]
    const startU = currentFrame.distance / uvScale
    const endU = currentFrame.distance / uvScale + segmentLength / uvScale

    appendQuad(
      rightBottomCurrent,
      rightTopCurrent,
      rightBottomNext,
      rightTopNext,
      outerNormalCurrent,
      outerNormalCurrent,
      outerNormalNext,
      outerNormalNext,
      [startU, wallBaseV],
      [startU, wallTopV],
      [endU, wallBaseV],
      [endU, wallTopV],
    )

    appendQuad(
      leftBottomNext,
      leftTopNext,
      leftBottomCurrent,
      leftTopCurrent,
      innerNormalNext,
      innerNormalNext,
      innerNormalCurrent,
      innerNormalCurrent,
      [endU, wallBaseV],
      [endU, wallTopV],
      [startU, wallBaseV],
      [startU, wallTopV],
    )

    appendQuad(
      leftTopCurrent,
      leftTopNext,
      rightTopCurrent,
      rightTopNext,
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [startU, 0],
      [endU, 0],
      [startU, wallThickness / uvScale],
      [endU, wallThickness / uvScale],
    )

    if (wallBaseHeight > SPLINE_WALL_GEOMETRY_EPSILON) {
      appendQuad(
        rightBottomCurrent,
        rightBottomNext,
        leftBottomCurrent,
        leftBottomNext,
        [0, -1, 0],
        [0, -1, 0],
        [0, -1, 0],
        [0, -1, 0],
        [startU, 0],
        [endU, 0],
        [startU, wallThickness / uvScale],
        [endU, wallThickness / uvScale],
      )
    }
  }

  if (!chain.closed) {
    const firstFrame = frames[0]
    if (!firstFrame) {
      return createEmptySplineWallGeometryData()
    }
    const firstPoint = firstFrame.position
    const firstTangent = firstFrame.tangent
    const firstNormal = firstFrame.normal
    const startCapNormal: [number, number, number] = [-firstTangent[0], 0, -firstTangent[1]]

    appendQuad(
      toWorldVertex(firstPoint, firstNormal, -halfThickness * firstFrame.offsetScale, wallBaseHeight),
      toWorldVertex(firstPoint, firstNormal, -halfThickness * firstFrame.offsetScale, wallTopHeight),
      toWorldVertex(firstPoint, firstNormal, halfThickness * firstFrame.offsetScale, wallBaseHeight),
      toWorldVertex(firstPoint, firstNormal, halfThickness * firstFrame.offsetScale, wallTopHeight),
      startCapNormal,
      startCapNormal,
      startCapNormal,
      startCapNormal,
      [0, wallBaseV],
      [0, wallTopV],
      [wallThickness / uvScale, wallBaseV],
      [wallThickness / uvScale, wallTopV],
    )

    const lastFrame = frames.at(-1)
    if (lastFrame) {
      const lastPoint = lastFrame.position
      const lastTangent = lastFrame.tangent
      const lastNormal = lastFrame.normal
      const endCapNormal: [number, number, number] = [lastTangent[0], 0, lastTangent[1]]
      appendQuad(
        toWorldVertex(lastPoint, lastNormal, halfThickness * lastFrame.offsetScale, wallBaseHeight),
        toWorldVertex(lastPoint, lastNormal, halfThickness * lastFrame.offsetScale, wallTopHeight),
        toWorldVertex(lastPoint, lastNormal, -halfThickness * lastFrame.offsetScale, wallBaseHeight),
        toWorldVertex(lastPoint, lastNormal, -halfThickness * lastFrame.offsetScale, wallTopHeight),
        endCapNormal,
        endCapNormal,
        endCapNormal,
        endCapNormal,
        [0, wallBaseV],
        [0, wallTopV],
        [wallThickness / uvScale, wallBaseV],
        [wallThickness / uvScale, wallTopV],
      )
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normalsArray),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices),
  }
}

export function buildSampledSplineWallFrames(
  chain: RoomSplineWallChain,
  options: SplineWallGeometryOptions = {},
): SampledSplineWallFrame[] {
  if (chain.points.length < 2) {
    return []
  }

  const sampledPoints = buildSampledBoundaryPath(chain, options)
  if (sampledPoints.length < 2) {
    return []
  }

  const distances = buildSampleDistances(sampledPoints)
  return sampledPoints.map((_, index) => buildSampledSplineWallFrame(
    sampledPoints,
    index,
    chain.closed,
    distances[index] ?? 0,
  ))
}

function collectRoomBoundaryEdges(
  roomId: string,
  paintedCells: PaintedCellsLike,
): BoundaryEdge[] {
  const edges: BoundaryEdge[] = []

  Object.values(paintedCells).forEach((record) => {
    if (record.roomId !== roomId) {
      return
    }

    const [cellX, cellZ] = record.cell

    if (paintedCells[getCellKey([cellX, cellZ + 1])]?.roomId !== roomId) {
      edges.push({
        roomId,
        wallKey: `${cellX}:${cellZ}:north`,
        start: [cellX, cellZ + 1],
        end: [cellX + 1, cellZ + 1],
      })
    }

    if (paintedCells[getCellKey([cellX + 1, cellZ])]?.roomId !== roomId) {
      edges.push({
        roomId,
        wallKey: `${cellX}:${cellZ}:east`,
        start: [cellX + 1, cellZ + 1],
        end: [cellX + 1, cellZ],
      })
    }

    if (paintedCells[getCellKey([cellX, cellZ - 1])]?.roomId !== roomId) {
      edges.push({
        roomId,
        wallKey: `${cellX}:${cellZ}:south`,
        start: [cellX + 1, cellZ],
        end: [cellX, cellZ],
      })
    }

    if (paintedCells[getCellKey([cellX - 1, cellZ])]?.roomId !== roomId) {
      edges.push({
        roomId,
        wallKey: `${cellX}:${cellZ}:west`,
        start: [cellX, cellZ],
        end: [cellX, cellZ + 1],
      })
    }
  })

  return edges
}

function traceBoundaryChains(edges: readonly BoundaryEdge[]): RoomSplineWallChain[] {
  if (edges.length === 0) {
    return []
  }

  const outgoingByPoint = new Map<string, BoundaryEdge[]>()
  const incomingCountByPoint = new Map<string, number>()
  const edgeById = new Map(edges.map((edge) => [edge.wallKey, edge]))
  const visited = new Set<string>()

  edges.forEach((edge) => {
    const startKey = getPointKey(edge.start)
    const endKey = getPointKey(edge.end)
    const bucket = outgoingByPoint.get(startKey)
    if (bucket) {
      bucket.push(edge)
    } else {
      outgoingByPoint.set(startKey, [edge])
    }
    incomingCountByPoint.set(endKey, (incomingCountByPoint.get(endKey) ?? 0) + 1)
  })

  const chains: RoomSplineWallChain[] = []

  while (visited.size < edgeById.size) {
    const startEdge = edges.find((edge) =>
      !visited.has(edge.wallKey) && (incomingCountByPoint.get(getPointKey(edge.start)) ?? 0) === 0)
      ?? edges.find((edge) => !visited.has(edge.wallKey))

    if (!startEdge) {
      break
    }

    visited.add(startEdge.wallKey)
    const wallKeys = [startEdge.wallKey]
    const points: SplineBoundaryPoint[] = [startEdge.start, startEdge.end]
    const startPoint = startEdge.start
    let currentEdge = startEdge
    let closed = false

    while (true) {
      const candidateEdges = (outgoingByPoint.get(getPointKey(currentEdge.end)) ?? [])
        .filter((edge) => !visited.has(edge.wallKey))

      if (candidateEdges.length === 0) {
        closed = pointsEqual(currentEdge.end, startPoint)
        if (closed) {
          points.pop()
        }
        break
      }

      const nextEdge = pickNextBoundaryEdge(currentEdge, candidateEdges)
      visited.add(nextEdge.wallKey)
      wallKeys.push(nextEdge.wallKey)
      points.push(nextEdge.end)
      currentEdge = nextEdge
    }

    chains.push({
      roomId: startEdge.roomId,
      wallKeys,
      points,
      closed,
    })
  }

  return chains
}

function pickNextBoundaryEdge(currentEdge: BoundaryEdge, candidates: readonly BoundaryEdge[]) {
  if (candidates.length === 1) {
    return candidates[0]
  }

  const currentDirection = subtractPoints(currentEdge.end, currentEdge.start)

  return [...candidates].sort((left, right) => {
    const leftDirection = subtractPoints(left.end, left.start)
    const rightDirection = subtractPoints(right.end, right.start)
    const leftCross = cross2D(currentDirection, leftDirection)
    const rightCross = cross2D(currentDirection, rightDirection)
    if (leftCross !== rightCross) {
      return leftCross - rightCross
    }
    const leftDot = dot2D(currentDirection, leftDirection)
    const rightDot = dot2D(currentDirection, rightDirection)
    return rightDot - leftDot
  })[0]!
}

function buildSampledBoundaryPath(
  chain: RoomSplineWallChain,
  options: SplineWallGeometryOptions,
): WorldPoint[] {
  const worldPoints = chain.points.map(boundaryPointToWorldPoint)
  const cornerRadius = Math.max(options.cornerRadius ?? DEFAULT_CORNER_RADIUS, 0)
  const curveSubdivisions = Math.max(1, Math.floor(options.curveSubdivisions ?? DEFAULT_CURVE_SUBDIVISIONS))

  if (worldPoints.length < 2) {
    return worldPoints
  }

  const entries = worldPoints.map((point, index) => {
    const previous = getPointAtIndex(worldPoints, index - 1, chain.closed)
    const next = getPointAtIndex(worldPoints, index + 1, chain.closed)
    const isEndpoint = !chain.closed && (index === 0 || index === worldPoints.length - 1)
    const cornerStyle = chain.cornerStyles?.[index]
    const hasExplicitCornerStyle = cornerStyle !== undefined
    const requestedCornerRadius = hasExplicitCornerStyle
      ? Math.max((cornerStyle?.amount ?? 0) * GRID_SIZE, 0)
      : cornerRadius

    if (!previous || !next || isEndpoint) {
      return {
        point,
        entry: point,
        exit: point,
        kind: 'square' as const,
      }
    }

    const incoming = normalizePoint(subtractPoints(point, previous))
    const outgoing = normalizePoint(subtractPoints(next, point))
    if (Math.abs(cross2D(incoming, outgoing)) <= SPLINE_WALL_GEOMETRY_EPSILON || dot2D(incoming, outgoing) > 0.999) {
      return {
        point,
        entry: point,
        exit: point,
        kind: 'square' as const,
      }
    }

    const incomingLength = distanceBetweenPoints(previous, point)
    const outgoingLength = distanceBetweenPoints(point, next)
    const cutDistance = Math.min(requestedCornerRadius, incomingLength / 2, outgoingLength / 2)

    if (
      cutDistance <= SPLINE_WALL_GEOMETRY_EPSILON
      || (hasExplicitCornerStyle && cornerStyle?.mode === 'square')
      || (!hasExplicitCornerStyle && cornerRadius <= SPLINE_WALL_GEOMETRY_EPSILON)
    ) {
      return {
        point,
        entry: point,
        exit: point,
        kind: 'square' as const,
      }
    }

    return {
      point,
      entry: addPoints(point, scalePoint(incoming, -cutDistance)),
      exit: addPoints(point, scalePoint(outgoing, cutDistance)),
      kind: hasExplicitCornerStyle && cornerStyle?.mode === 'diagonal'
        ? 'diagonal' as const
        : 'rounded' as const,
    }
  })

  const sampled: WorldPoint[] = []

  const appendPoint = (point: WorldPoint) => {
    const previous = sampled.at(-1)
    if (previous && distanceBetweenPoints(previous, point) <= SPLINE_WALL_GEOMETRY_EPSILON) {
      return
    }
    sampled.push(point)
  }

  if (chain.closed) {
    const firstEntry = entries[0]
    appendPoint(firstEntry.kind === 'square' ? firstEntry.point : firstEntry.exit)

    for (let index = 1; index < entries.length; index += 1) {
      const current = entries[index]
      appendPoint(current.entry)
      if (current.kind === 'rounded') {
        appendQuadraticCurvePoints(sampled, current.entry, current.point, current.exit, curveSubdivisions)
      } else {
        appendPoint(current.kind === 'diagonal' ? current.exit : current.point)
      }
    }

    appendPoint(firstEntry.entry)
    if (firstEntry.kind === 'rounded') {
      appendQuadraticCurvePoints(sampled, firstEntry.entry, firstEntry.point, firstEntry.exit, curveSubdivisions)
    } else if (firstEntry.kind === 'diagonal') {
      appendPoint(firstEntry.exit)
    }

    if (sampled.length > 1 && distanceBetweenPoints(sampled[0]!, sampled.at(-1)!) <= SPLINE_WALL_GEOMETRY_EPSILON) {
      sampled.pop()
    }

    return sampled
  }

  appendPoint(worldPoints[0]!)
  for (let index = 1; index < entries.length - 1; index += 1) {
    const current = entries[index]
    appendPoint(current.entry)
    if (current.kind === 'rounded') {
      appendQuadraticCurvePoints(sampled, current.entry, current.point, current.exit, curveSubdivisions)
    } else {
      appendPoint(current.kind === 'diagonal' ? current.exit : current.point)
    }
  }
  appendPoint(worldPoints.at(-1)!)

  return sampled
}

function appendQuadraticCurvePoints(
  sampled: WorldPoint[],
  start: WorldPoint,
  control: WorldPoint,
  end: WorldPoint,
  subdivisions: number,
) {
  for (let step = 1; step <= subdivisions; step += 1) {
    const t = step / subdivisions
    const point = evaluateQuadraticBezierPoint(start, control, end, t)
    if (step === subdivisions && distanceBetweenPoints(point, end) <= SPLINE_WALL_GEOMETRY_EPSILON) {
      sampled.push(end)
      continue
    }
    sampled.push(point)
  }
}

function resolveSplineWallFrameTangent(
  incoming: SplineBoundaryPoint | null,
  outgoing: SplineBoundaryPoint | null,
): SplineBoundaryPoint {
  if (incoming && outgoing) {
    const tangent = normalizePoint(addPoints(incoming, outgoing))
    if (magnitudeSquared(tangent) > SPLINE_WALL_GEOMETRY_EPSILON) {
      return tangent
    }
  }

  return incoming ?? outgoing ?? [1, 0]
}

function resolveSplineWallFrameNormal(
  tangent: SplineBoundaryPoint,
  incoming: SplineBoundaryPoint | null,
  outgoing: SplineBoundaryPoint | null,
): SplineBoundaryPoint {
  if (incoming && outgoing) {
    const miterNormal = normalizePoint(addPoints(perpendicularPoint(incoming), perpendicularPoint(outgoing)))
    if (magnitudeSquared(miterNormal) > SPLINE_WALL_GEOMETRY_EPSILON) {
      return miterNormal
    }
  }

  return perpendicularPoint(tangent)
}

function resolveSplineWallFrameOffsetScale(
  normal: SplineBoundaryPoint,
  incoming: SplineBoundaryPoint | null,
  outgoing: SplineBoundaryPoint | null,
) {
  const normalCandidates = [incoming, outgoing]
    .filter((tangent): tangent is SplineBoundaryPoint => tangent !== null)
    .map((tangent) => perpendicularPoint(tangent))
    .map((candidateNormal) => Math.abs(dot2D(normal, candidateNormal)))
    .filter((dot) => dot > SPLINE_WALL_GEOMETRY_EPSILON)

  if (normalCandidates.length === 0) {
    return 1
  }

  return Math.min(1 / Math.min(...normalCandidates), MAX_SPLINE_WALL_MITER_SCALE)
}

function buildSampledSplineWallFrame(
  points: readonly WorldPoint[],
  index: number,
  closed: boolean,
  distance: number,
): SampledSplineWallFrame {
  const point = points[index]!
  const previousPoint = getPointAtIndex(points, index - 1, closed)
  const nextPoint = getPointAtIndex(points, index + 1, closed)
  const incoming = previousPoint ? normalizePoint(subtractPoints(point, previousPoint)) : null
  const outgoing = nextPoint ? normalizePoint(subtractPoints(nextPoint, point)) : null

  if (!incoming && !outgoing) {
    return {
      position: point,
      tangent: [1, 0],
      normal: [0, 1],
      distance,
      offsetScale: 1,
    }
  }

  const tangent = resolveSplineWallFrameTangent(incoming, outgoing)
  const normal = resolveSplineWallFrameNormal(tangent, incoming, outgoing)
  const offsetScale = resolveSplineWallFrameOffsetScale(normal, incoming, outgoing)

  return {
    position: point,
    tangent,
    normal,
    distance,
    offsetScale,
  }
}

function buildSampleDistances(points: readonly WorldPoint[]) {
  const distances = new Array<number>(points.length).fill(0)

  for (let index = 1; index < points.length; index += 1) {
    distances[index] = distances[index - 1]! + distanceBetweenPoints(points[index - 1]!, points[index]!)
  }

  return distances
}

function mergeSplineWallGeometryData(geometries: readonly SplineWallGeometryData[]): SplineWallGeometryData {
  const totalPositions = geometries.reduce((sum, geometry) => sum + geometry.positions.length, 0)
  const totalNormals = geometries.reduce((sum, geometry) => sum + geometry.normals.length, 0)
  const totalUvs = geometries.reduce((sum, geometry) => sum + geometry.uvs.length, 0)
  const totalIndices = geometries.reduce((sum, geometry) => sum + geometry.indices.length, 0)

  const positions = new Float32Array(totalPositions)
  const normals = new Float32Array(totalNormals)
  const uvs = new Float32Array(totalUvs)
  const indices = new Uint32Array(totalIndices)

  let positionOffset = 0
  let normalOffset = 0
  let uvOffset = 0
  let indexOffset = 0
  let vertexOffset = 0

  geometries.forEach((geometry) => {
    positions.set(geometry.positions, positionOffset)
    normals.set(geometry.normals, normalOffset)
    uvs.set(geometry.uvs, uvOffset)
    geometry.indices.forEach((index, localIndex) => {
      indices[indexOffset + localIndex] = index + vertexOffset
    })

    positionOffset += geometry.positions.length
    normalOffset += geometry.normals.length
    uvOffset += geometry.uvs.length
    indexOffset += geometry.indices.length
    vertexOffset += geometry.positions.length / 3
  })

  return {
    positions,
    normals,
    uvs,
    indices,
  }
}

function createEmptySplineWallGeometryData(): SplineWallGeometryData {
  return {
    positions: new Float32Array(0),
    normals: new Float32Array(0),
    uvs: new Float32Array(0),
    indices: new Uint32Array(0),
  }
}

function boundaryPointToWorldPoint(point: SplineBoundaryPoint): WorldPoint {
  return [point[0] * GRID_SIZE, point[1] * GRID_SIZE]
}

function toWorldVertex(
  point: WorldPoint,
  normal: SplineBoundaryPoint,
  lateralOffset: number,
  height: number,
): [number, number, number] {
  return [
    point[0] + normal[0] * lateralOffset,
    height,
    point[1] + normal[1] * lateralOffset,
  ]
}

function getPointAtIndex<T>(
  points: readonly T[],
  index: number,
  closed: boolean,
): T | null {
  if (closed) {
    const normalizedIndex = ((index % points.length) + points.length) % points.length
    return points[normalizedIndex] ?? null
  }

  return points[index] ?? null
}

function getPointKey(point: SplineBoundaryPoint) {
  return `${point[0]}:${point[1]}`
}

function pointsEqual(left: SplineBoundaryPoint, right: SplineBoundaryPoint) {
  return left[0] === right[0] && left[1] === right[1]
}

function subtractPoints(left: SplineBoundaryPoint, right: SplineBoundaryPoint): SplineBoundaryPoint {
  return [left[0] - right[0], left[1] - right[1]]
}

function addPoints(left: SplineBoundaryPoint, right: SplineBoundaryPoint): SplineBoundaryPoint {
  return [left[0] + right[0], left[1] + right[1]]
}

function scalePoint(point: SplineBoundaryPoint, scalar: number): SplineBoundaryPoint {
  return [point[0] * scalar, point[1] * scalar]
}

function normalizePoint(point: SplineBoundaryPoint): SplineBoundaryPoint {
  const length = Math.hypot(point[0], point[1])
  if (length <= SPLINE_WALL_GEOMETRY_EPSILON) {
    return [0, 0]
  }
  return [point[0] / length, point[1] / length]
}

function perpendicularPoint(point: SplineBoundaryPoint): SplineBoundaryPoint {
  return [-point[1], point[0]]
}

function dot2D(left: SplineBoundaryPoint, right: SplineBoundaryPoint) {
  return left[0] * right[0] + left[1] * right[1]
}

function cross2D(left: SplineBoundaryPoint, right: SplineBoundaryPoint) {
  return left[0] * right[1] - left[1] * right[0]
}

function distanceBetweenPoints(left: SplineBoundaryPoint, right: SplineBoundaryPoint) {
  return Math.hypot(left[0] - right[0], left[1] - right[1])
}

function magnitudeSquared(point: SplineBoundaryPoint) {
  return point[0] * point[0] + point[1] * point[1]
}

function getRoomLayerId(roomId: string, paintedCells: PaintedCellsLike) {
  return Object.values(paintedCells).find((record) => record.roomId === roomId)?.layerId ?? 'main'
}

function buildPathSplineWallChains(
  path: SplineWallGraph['paths'][string],
  splineWallGraph: SplineWallGraph,
  suppressedWallKeys: ReadonlySet<string>,
  defaultWallHeight: number,
  respectCutouts: boolean,
  sharedSegmentGroups: ReadonlyMap<string, SharedSplineWallSegmentGroup>,
  sharedSuppressedIntervals: ReadonlyMap<string, readonly SplineWallSharedSuppressedInterval[]>,
): RoomSplineWallChain[] {
  return getPathSplineWallHeightBands(
    path,
    splineWallGraph,
    defaultWallHeight,
    respectCutouts,
    sharedSegmentGroups,
  )
    .flatMap(({ baseHeight, topHeight }) => {
      const segmentEntries = path.segmentIds
        .flatMap((segmentId, index) => {
          const segment = splineWallGraph.segments[segmentId]
          const start = splineWallGraph.nodes[segment?.startNodeId ?? '']?.position
          const end = splineWallGraph.nodes[segment?.endNodeId ?? '']?.position
          if (!segment || !start || !end) {
            return []
          }

          return buildPathSegmentEntries(
            path,
            index,
            segment,
            splineWallGraph,
            start,
            end,
            suppressedWallKeys,
            baseHeight,
            topHeight,
            defaultWallHeight,
            respectCutouts,
            sharedSegmentGroups,
            sharedSuppressedIntervals,
          )
        })

      return buildSplineWallChainsFromSegmentEntries(
        path,
        splineWallGraph,
        segmentEntries,
        baseHeight,
        topHeight - baseHeight,
        defaultWallHeight,
      )
    })
}

type PathSplineWallSegmentEntry = {
  wallKey: string
  startNodeId: string | null
  endNodeId: string | null
  start: SplineBoundaryPoint
  end: SplineBoundaryPoint
  suppressed: boolean
}

type SharedSplineWallSegmentGroup = {
  ownerSegmentId: string
  segmentIds: string[]
}

type SplineWallHeightBand = {
  baseHeight: number
  topHeight: number
}

function getPathSplineWallHeightBands(
  path: SplineWallGraph['paths'][string],
  splineWallGraph: SplineWallGraph,
  defaultWallHeight: number,
  respectCutouts: boolean,
  sharedSegmentGroups: ReadonlyMap<string, SharedSplineWallSegmentGroup>,
): SplineWallHeightBand[] {
  const breakpoints = path.segmentIds
    .flatMap((segmentId) => {
      const segment = splineWallGraph.segments[segmentId]
      if (!segment) {
        return []
      }

      const resolvedWallHeight = getResolvedSplineWallSegmentHeight(segment, defaultWallHeight)
      const cutouts = sharedSegmentGroups.get(segmentId)?.ownerSegmentId === segmentId
        ? getSharedRenderableSegmentCutouts(
            splineWallGraph,
            segmentId,
            sharedSegmentGroups.get(segmentId)?.segmentIds ?? [segmentId],
          )
        : segment.cutouts
      const cutoutBreakpoints = respectCutouts
        ? cutouts.flatMap((cutout) => {
            const bottomHeight = clampSplineWallHeight(cutout.bottomHeight, resolvedWallHeight)
            const topHeight = cutout.topHeight === null
              ? resolvedWallHeight
              : clampSplineWallHeight(cutout.topHeight, resolvedWallHeight)
            return [bottomHeight, topHeight]
          })
        : []

      return [0, resolvedWallHeight, ...cutoutBreakpoints]
    })
    .sort((left, right) => left - right)
    .reduce<number[]>((acc, breakpoint) => {
      if (
        breakpoint <= SPLINE_WALL_GEOMETRY_EPSILON
        || acc.some((value) => Math.abs(value - breakpoint) <= SPLINE_WALL_GEOMETRY_EPSILON)
      ) {
        return acc
      }

      acc.push(breakpoint)
      return acc
    }, [0])

  return breakpoints
    .slice(0, -1)
    .map((baseHeight, index) => ({
      baseHeight,
      topHeight: breakpoints[index + 1] ?? baseHeight,
    }))
    .filter(({ baseHeight, topHeight }) => topHeight - baseHeight > SPLINE_WALL_GEOMETRY_EPSILON)
}

function buildSplineWallChainsFromSegmentEntries(
  path: SplineWallGraph['paths'][string],
  splineWallGraph: SplineWallGraph,
  segmentEntries: readonly PathSplineWallSegmentEntry[],
  wallBaseHeight: number,
  wallHeight: number,
  defaultWallHeight: number,
): RoomSplineWallChain[] {
  if (segmentEntries.length === 0 || wallHeight <= SPLINE_WALL_GEOMETRY_EPSILON) {
    return []
  }

  const runs: PathSplineWallSegmentEntry[][] = []
  let currentRun: PathSplineWallSegmentEntry[] = []

  segmentEntries.forEach((entry) => {
    if (entry.suppressed) {
      if (currentRun.length > 0) {
        runs.push(currentRun)
        currentRun = []
      }
      return
    }

    currentRun.push(entry)
  })

  if (path.closed && currentRun.length > 0 && runs.length > 0 && !segmentEntries[0]!.suppressed) {
    runs[0] = [...currentRun, ...runs[0]!]
  } else if (currentRun.length > 0) {
    runs.push(currentRun)
  }

  return runs.flatMap((run) => {
    const points: SplineBoundaryPoint[] = [run[0]!.start, ...run.map((entry) => entry.end)]
    const pointNodeIds = [run[0]!.startNodeId, ...run.map((entry) => entry.endNodeId)]
    const closed =
      path.closed
      && run.length === segmentEntries.length
      && segmentEntries.length === path.segmentIds.length
    if (closed && points.length > 1 && pointsEqual(points[0]!, points.at(-1)!)) {
      points.pop()
      pointNodeIds.pop()
    }

    if (points.length < 2) {
      return []
    }

    return [{
      roomId: path.roomId ?? path.id,
      wallKeys: run.map((entry) => entry.wallKey),
      points,
      closed,
      cornerStyles: pointNodeIds.map((nodeId) =>
        nodeId ? getSplineWallNodeCornerStyle(splineWallGraph.nodes[nodeId]) : undefined),
      wallBaseHeight: wallBaseHeight > SPLINE_WALL_GEOMETRY_EPSILON ? wallBaseHeight : undefined,
      wallHeight: wallBaseHeight > SPLINE_WALL_GEOMETRY_EPSILON || Math.abs(wallHeight - defaultWallHeight) > SPLINE_WALL_GEOMETRY_EPSILON
        ? wallHeight
        : undefined,
    }]
  })
}

function buildSharedSplineWallSegmentGroups(
  splineWallGraph: SplineWallGraph,
  visibleLayerIds: ReadonlySet<string> | null,
) {
  const segmentsByGeometryKey = new Map<string, SplineWallGraph['segments'][string][]>()

  Object.values(splineWallGraph.segments).forEach((segment) => {
    if (visibleLayerIds && !visibleLayerIds.has(segment.layerId)) {
      return
    }

    const start = splineWallGraph.nodes[segment.startNodeId]?.position
    const end = splineWallGraph.nodes[segment.endNodeId]?.position
    if (!start || !end) {
      return
    }

    const geometryKey = buildCoincidentSegmentKey(segment.layerId, start, end)
    const existing = segmentsByGeometryKey.get(geometryKey)
    if (existing) {
      existing.push(segment)
    } else {
      segmentsByGeometryKey.set(geometryKey, [segment])
    }
  })

  const sharedSegmentGroups = new Map<string, SharedSplineWallSegmentGroup>()
  segmentsByGeometryKey.forEach((segments) => {
    if (segments.length < 2) {
      return
    }

    const distinctRoomIds = new Set(
      segments.map((segment) => segment.roomId ?? `segment:${segment.id}`),
    )
    if (distinctRoomIds.size < 2) {
      return
    }

    const ownerSegmentId = [...segments].sort(compareSplineWallSegmentOwnership)[0]?.id
    if (!ownerSegmentId) {
      return
    }

    const segmentIds = [...new Set(segments.map((segment) => segment.id))]
    segmentIds.forEach((segmentId) => {
      sharedSegmentGroups.set(segmentId, {
        ownerSegmentId,
        segmentIds,
      })
    })
  })

  return sharedSegmentGroups
}

function buildSharedSplineWallSegmentOverlapIntervals(
  splineWallGraph: SplineWallGraph,
  visibleLayerIds: ReadonlySet<string> | null,
  options: SplineWallGeometryOptions,
) {
  const sharedEdgesByGeometryKey = new Map<string, SampledSplineWallSharedEdge[]>()

  Object.values(splineWallGraph.paths).forEach((path) => {
    if (visibleLayerIds && !visibleLayerIds.has(path.layerId)) {
      return
    }

    const straightSegments = path.segmentIds
      .map((segmentId) => buildStraightSplineWallSegmentReference(splineWallGraph, segmentId))
      .filter((segment): segment is StraightSplineWallSegmentReference => Boolean(segment))
    if (straightSegments.length === 0) {
      return
    }

    const sampledPath = buildSampledSplineWallPathFromGraph(path, splineWallGraph, options)
    const edgeCount = path.closed ? sampledPath.length : sampledPath.length - 1
    for (let index = 0; index < edgeCount; index += 1) {
      const start = sampledPath[index]
      const end = sampledPath[(index + 1) % sampledPath.length]
      if (!start || !end || distanceBetweenPoints(start, end) <= SPLINE_WALL_GEOMETRY_EPSILON) {
        continue
      }

      const ownerSegment = findOwningStraightSplineWallSegment(
        interpolateSplineBoundaryPoint(start, end, 0.5),
        straightSegments,
      )
      if (!ownerSegment) {
        continue
      }

      const geometryKey = buildCoincidentWorldSegmentKey(path.layerId, start, end)
      const nextEdge = {
        segmentId: ownerSegment.segmentId,
        roomId: ownerSegment.roomId,
        startRatio: projectWorldPointToSegmentRatio(start, ownerSegment.start, ownerSegment.end),
        endRatio: projectWorldPointToSegmentRatio(end, ownerSegment.start, ownerSegment.end),
      } satisfies SampledSplineWallSharedEdge
      const existing = sharedEdgesByGeometryKey.get(geometryKey)
      if (existing) {
        existing.push(nextEdge)
      } else {
        sharedEdgesByGeometryKey.set(geometryKey, [nextEdge])
      }
    }
  })

  const suppressedIntervalsBySegment = new Map<string, SplineWallSharedSuppressedInterval[]>()
  sharedEdgesByGeometryKey.forEach((edges) => {
    const distinctRoomIds = new Set(
      edges.map((edge) => edge.roomId ?? `segment:${edge.segmentId}`),
    )
    if (distinctRoomIds.size < 2) {
      return
    }

    const ownerSegmentId = [...new Set(edges.map((edge) => edge.segmentId))]
      .map((segmentId) => splineWallGraph.segments[segmentId])
      .filter((segment): segment is SplineWallGraph['segments'][string] => Boolean(segment))
      .sort(compareSplineWallSegmentOwnership)[0]?.id
    if (!ownerSegmentId) {
      return
    }

    edges.forEach((edge) => {
      if (edge.segmentId === ownerSegmentId) {
        return
      }

      const startRatio = Math.min(edge.startRatio, edge.endRatio)
      const endRatio = Math.max(edge.startRatio, edge.endRatio)
      if (endRatio - startRatio <= SPLINE_WALL_GEOMETRY_EPSILON) {
        return
      }

      const nextIntervals = suppressedIntervalsBySegment.get(edge.segmentId) ?? []
      nextIntervals.push([startRatio, endRatio])
      suppressedIntervalsBySegment.set(edge.segmentId, nextIntervals)
    })
  })

  return new Map(
    [...suppressedIntervalsBySegment.entries()].map(([segmentId, intervals]) => [
      segmentId,
      mergeSplineWallSuppressedIntervals(intervals),
    ]),
  )
}

function buildCoincidentSegmentKey(
  layerId: string,
  start: SplineBoundaryPoint,
  end: SplineBoundaryPoint,
) {
  const startKey = getPointKey(start)
  const endKey = getPointKey(end)
  return startKey <= endKey
    ? `${layerId}:${startKey}|${endKey}`
    : `${layerId}:${endKey}|${startKey}`
}

function compareSplineWallSegmentOwnership(
  left: SplineWallGraph['segments'][string],
  right: SplineWallGraph['segments'][string],
) {
  const leftOwnership = getSplineWallSegmentOwnershipOrder(left)
  const rightOwnership = getSplineWallSegmentOwnershipOrder(right)

  if (leftOwnership.rank !== rightOwnership.rank) {
    return leftOwnership.rank - rightOwnership.rank
  }
  if (leftOwnership.cellX !== rightOwnership.cellX) {
    return leftOwnership.cellX - rightOwnership.cellX
  }
  if (leftOwnership.cellZ !== rightOwnership.cellZ) {
    return leftOwnership.cellZ - rightOwnership.cellZ
  }
  if (leftOwnership.directionRank !== rightOwnership.directionRank) {
    return leftOwnership.directionRank - rightOwnership.directionRank
  }
  if (leftOwnership.roomId !== rightOwnership.roomId) {
    return leftOwnership.roomId.localeCompare(rightOwnership.roomId)
  }
  return left.id.localeCompare(right.id)
}

function getSplineWallSegmentOwnershipOrder(segment: SplineWallGraph['segments'][string]) {
  if (segment.wallKey) {
    const [cellXText = '', cellZText = '', direction = ''] = segment.wallKey.split(':')
    const cellX = Number.parseInt(cellXText, 10)
    const cellZ = Number.parseInt(cellZText, 10)
    if (Number.isFinite(cellX) && Number.isFinite(cellZ)) {
      return {
        rank: 0,
        cellX,
        cellZ,
        directionRank: getWallDirectionSortRank(direction),
        roomId: segment.roomId ?? '',
      }
    }
  }

  return {
    rank: segment.wallKey ? 1 : 2,
    cellX: Number.POSITIVE_INFINITY,
    cellZ: Number.POSITIVE_INFINITY,
    directionRank: Number.POSITIVE_INFINITY,
    roomId: segment.roomId ?? '',
  }
}

function getWallDirectionSortRank(direction: string) {
  switch (direction) {
    case 'north':
      return 0
    case 'east':
      return 1
    case 'south':
      return 2
    case 'west':
      return 3
    default:
      return 4
  }
}

export function getSharedRenderableSegmentCutouts(
  splineWallGraph: SplineWallGraph,
  ownerSegmentId: string,
  segmentIds: readonly string[],
) {
  const ownerSegment = splineWallGraph.segments[ownerSegmentId]
  const ownerStart = splineWallGraph.nodes[ownerSegment?.startNodeId ?? '']?.position
  const ownerEnd = splineWallGraph.nodes[ownerSegment?.endNodeId ?? '']?.position
  if (!ownerSegment || !ownerStart || !ownerEnd) {
    return ownerSegment?.cutouts ?? []
  }

  return segmentIds.flatMap((segmentId) => {
    const segment = splineWallGraph.segments[segmentId]
    const start = splineWallGraph.nodes[segment?.startNodeId ?? '']?.position
    const end = splineWallGraph.nodes[segment?.endNodeId ?? '']?.position
    if (!segment || !start || !end) {
      return []
    }

    const isReversed = pointsEqual(start, ownerEnd) && pointsEqual(end, ownerStart)
    if (!isReversed) {
      return segment.cutouts
    }

    return segment.cutouts.map((cutout) => ({
      ...cutout,
      startRatio: 1 - cutout.endRatio,
      endRatio: 1 - cutout.startRatio,
    }))
  })
}

function buildPathSegmentEntries(
  path: SplineWallGraph['paths'][string],
  index: number,
  segment: SplineWallGraph['segments'][string],
  splineWallGraph: SplineWallGraph,
  start: SplineBoundaryPoint,
  end: SplineBoundaryPoint,
  suppressedWallKeys: ReadonlySet<string>,
  bandBaseHeight: number,
  bandTopHeight: number,
  defaultWallHeight: number,
  respectCutouts: boolean,
  sharedSegmentGroups: ReadonlyMap<string, SharedSplineWallSegmentGroup>,
  sharedSuppressedIntervals: ReadonlyMap<string, readonly SplineWallSharedSuppressedInterval[]>,
): PathSplineWallSegmentEntry[] {
  const resolvedWallHeight = getResolvedSplineWallSegmentHeight(segment, defaultWallHeight)
  if (
    bandTopHeight - bandBaseHeight <= SPLINE_WALL_GEOMETRY_EPSILON
    || bandBaseHeight >= resolvedWallHeight - SPLINE_WALL_GEOMETRY_EPSILON
  ) {
    return []
  }

  const wallKey = segment.wallKey ?? `${path.id}:segment:${index}`
  const sharedSegmentGroup = sharedSegmentGroups.get(segment.id)
  if (sharedSegmentGroup && sharedSegmentGroup.ownerSegmentId !== segment.id) {
    return [createPathSegmentEntry(wallKey, segment, start, end, 0, 1, true)]
  }
  const isSuppressedByLegacyOpening = !!segment.wallKey && suppressedWallKeys.has(segment.wallKey)
  if (isSuppressedByLegacyOpening) {
    return [createPathSegmentEntry(wallKey, segment, start, end, 0, 1, true)]
  }

  const overlapSuppressedIntervals = sharedSuppressedIntervals.get(segment.id) ?? []
  if (!respectCutouts && overlapSuppressedIntervals.length === 0) {
    return [createPathSegmentEntry(wallKey, segment, start, end, 0, 1, false)]
  }

  const cutoutIntervals = respectCutouts
    ? getMergedSplineWallCutoutIntervalsForBand(
        sharedSegmentGroup
          ? getSharedRenderableSegmentCutouts(splineWallGraph, sharedSegmentGroup.ownerSegmentId, sharedSegmentGroup.segmentIds)
          : segment.cutouts,
        bandBaseHeight,
        bandTopHeight,
        resolvedWallHeight,
      )
    : []
  const suppressedIntervals = mergeSplineWallSuppressedIntervals([
    ...overlapSuppressedIntervals,
    ...cutoutIntervals,
  ])
  if (suppressedIntervals.length === 0) {
    return [createPathSegmentEntry(wallKey, segment, start, end, 0, 1, false)]
  }

  const entries: PathSplineWallSegmentEntry[] = []
  let cursor = 0

  suppressedIntervals.forEach(([suppressedStart, suppressedEnd]) => {
    if (suppressedStart > cursor + SPLINE_WALL_GEOMETRY_EPSILON) {
      entries.push(createPathSegmentEntry(wallKey, segment, start, end, cursor, suppressedStart, false))
    }

    entries.push(createPathSegmentEntry(wallKey, segment, start, end, suppressedStart, suppressedEnd, true))
    cursor = suppressedEnd
  })

  if (cursor < 1 - SPLINE_WALL_GEOMETRY_EPSILON) {
    entries.push(createPathSegmentEntry(wallKey, segment, start, end, cursor, 1, false))
  }

  return entries
}

function getResolvedSplineWallSegmentHeight(
  segment: SplineWallGraph['segments'][string],
  defaultWallHeight: number,
) {
  return segment.wallHeight ?? defaultWallHeight
}

function createPathSegmentEntry(
  wallKey: string,
  segment: SplineWallGraph['segments'][string],
  start: SplineBoundaryPoint,
  end: SplineBoundaryPoint,
  startRatio: number,
  endRatio: number,
  suppressed: boolean,
): PathSplineWallSegmentEntry {
  return {
    wallKey,
    startNodeId: startRatio <= SPLINE_WALL_GEOMETRY_EPSILON ? segment.startNodeId : null,
    endNodeId: endRatio >= 1 - SPLINE_WALL_GEOMETRY_EPSILON ? segment.endNodeId : null,
    start: interpolateSplineBoundaryPoint(start, end, startRatio),
    end: interpolateSplineBoundaryPoint(start, end, endRatio),
    suppressed,
  }
}

function getMergedSplineWallCutoutIntervalsForBand(
  cutouts: readonly SplineWallGraph['segments'][string]['cutouts'][number][],
  bandBaseHeight: number,
  bandTopHeight: number,
  resolvedWallHeight: number,
) {
  const sortedCutouts = cutouts
    .filter((cutout) => {
      const bottomHeight = clampSplineWallHeight(cutout.bottomHeight, resolvedWallHeight)
      const topHeight = cutout.topHeight === null
        ? resolvedWallHeight
        : clampSplineWallHeight(cutout.topHeight, resolvedWallHeight)
      return (
        bottomHeight <= bandBaseHeight + SPLINE_WALL_GEOMETRY_EPSILON
        && topHeight >= bandTopHeight - SPLINE_WALL_GEOMETRY_EPSILON
        && topHeight - bottomHeight > SPLINE_WALL_GEOMETRY_EPSILON
      )
    })
    .map((cutout) => ([
      Math.max(0, Math.min(cutout.startRatio, cutout.endRatio)),
      Math.min(1, Math.max(cutout.startRatio, cutout.endRatio)),
    ] as const))
    .filter(([startRatio, endRatio]) => endRatio - startRatio > SPLINE_WALL_GEOMETRY_EPSILON)
    .sort((left, right) => left[0] - right[0])

  return sortedCutouts.reduce<Array<readonly [number, number]>>((acc, [startRatio, endRatio]) => {
    const previous = acc.at(-1)
    if (!previous || startRatio > previous[1] + SPLINE_WALL_GEOMETRY_EPSILON) {
      acc.push([startRatio, endRatio])
      return acc
    }

    acc[acc.length - 1] = [previous[0], Math.max(previous[1], endRatio)]
    return acc
  }, [])
}

function buildStraightSplineWallSegmentReference(
  splineWallGraph: SplineWallGraph,
  segmentId: string,
): StraightSplineWallSegmentReference | null {
  const segment = splineWallGraph.segments[segmentId]
  const startNode = splineWallGraph.nodes[segment?.startNodeId ?? '']
  const endNode = splineWallGraph.nodes[segment?.endNodeId ?? '']
  if (!segment || !startNode || !endNode) {
    return null
  }

  const start = boundaryPointToWorldPoint(startNode.position)
  const end = boundaryPointToWorldPoint(endNode.position)
  return {
    segmentId: segment.id,
    roomId: segment.roomId,
    start,
    end,
    tangent: normalizePoint(subtractPoints(end, start)),
  }
}

function findOwningStraightSplineWallSegment(
  midpoint: WorldPoint,
  candidates: readonly StraightSplineWallSegmentReference[],
): StraightSplineWallSegmentReference | null {
  let owner: StraightSplineWallSegmentReference | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  let bestAlignment = Number.NEGATIVE_INFINITY

  candidates.forEach((candidate) => {
    const closestPoint = closestWorldPointOnSegment(midpoint, candidate.start, candidate.end)
    const distance = distanceBetweenPoints(midpoint, closestPoint)
    if (distance > bestDistance + SPLINE_WALL_GEOMETRY_EPSILON) {
      return
    }

    const offset = subtractPoints(midpoint, closestPoint)
    const alignment = Math.abs(dot2D(normalizePoint(offset), candidate.tangent))
    if (
      distance < bestDistance - SPLINE_WALL_GEOMETRY_EPSILON
      || alignment > bestAlignment + SPLINE_WALL_GEOMETRY_EPSILON
    ) {
      owner = candidate
      bestDistance = distance
      bestAlignment = alignment
    }
  })

  return owner
}

function projectWorldPointToSegmentRatio(
  point: WorldPoint,
  start: WorldPoint,
  end: WorldPoint,
) {
  const delta = subtractPoints(end, start)
  const lengthSquared = dot2D(delta, delta)
  if (lengthSquared <= SPLINE_WALL_GEOMETRY_EPSILON) {
    return 0
  }

  return clampSplineWallRatio(dot2D(subtractPoints(point, start), delta) / lengthSquared)
}

function closestWorldPointOnSegment(
  point: WorldPoint,
  start: WorldPoint,
  end: WorldPoint,
): WorldPoint {
  return interpolateSplineBoundaryPoint(
    start,
    end,
    projectWorldPointToSegmentRatio(point, start, end),
  )
}

function buildCoincidentWorldSegmentKey(
  layerId: string,
  start: WorldPoint,
  end: WorldPoint,
) {
  const startKey = getWorldPointKey(start)
  const endKey = getWorldPointKey(end)
  return startKey <= endKey
    ? `${layerId}:${startKey}|${endKey}`
    : `${layerId}:${endKey}|${startKey}`
}

function getWorldPointKey(point: WorldPoint) {
  return `${Math.round(point[0] * SAMPLED_SPLINE_WALL_KEY_SCALE)}:${Math.round(point[1] * SAMPLED_SPLINE_WALL_KEY_SCALE)}`
}

function mergeSplineWallSuppressedIntervals(
  intervals: readonly SplineWallSharedSuppressedInterval[],
) {
  const normalized = intervals
    .map(([startRatio, endRatio]) => [
      clampSplineWallRatio(Math.min(startRatio, endRatio)),
      clampSplineWallRatio(Math.max(startRatio, endRatio)),
    ] as const)
    .filter(([startRatio, endRatio]) => endRatio - startRatio > SPLINE_WALL_GEOMETRY_EPSILON)
    .sort((left, right) => left[0] - right[0])

  const merged: Array<[number, number]> = []
  normalized.forEach(([startRatio, endRatio]) => {
    const previous = merged.at(-1)
    if (!previous || startRatio > previous[1] + SPLINE_WALL_GEOMETRY_EPSILON) {
      merged.push([startRatio, endRatio])
      return
    }

    previous[1] = Math.max(previous[1], endRatio)
  })

  return merged.map(([startRatio, endRatio]) => [startRatio, endRatio] as const)
}

function clampSplineWallRatio(value: number) {
  return Math.min(Math.max(value, 0), 1)
}

function clampSplineWallHeight(value: number, resolvedWallHeight: number) {
  return Math.max(0, Math.min(value, resolvedWallHeight))
}

function interpolateSplineBoundaryPoint(
  start: SplineBoundaryPoint,
  end: SplineBoundaryPoint,
  ratio: number,
): SplineBoundaryPoint {
  if (ratio <= SPLINE_WALL_GEOMETRY_EPSILON) {
    return start
  }

  if (ratio >= 1 - SPLINE_WALL_GEOMETRY_EPSILON) {
    return end
  }

  return [
    start[0] + (end[0] - start[0]) * ratio,
    start[1] + (end[1] - start[1]) * ratio,
  ]
}

function getSplineWallNodeCornerStyle(node: SplineWallGraph['nodes'][string] | undefined) {
  if (!node || (node.cornerMode === undefined && node.cornerAmount === undefined)) {
    return undefined
  }

  return {
    mode: node.cornerMode ?? 'square',
    amount: Math.max(node.cornerAmount ?? 0, 0),
  }
}
