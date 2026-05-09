import { GRID_SIZE, type GridCell } from '../hooks/useSnapToGrid'
import { hasSplineWallGraphPaths, type SplineWallCutout, type SplineWallGraph, type SplineWallSegment } from './splineWallGraph'
import {
  DEFAULT_SPLINE_WALL_THICKNESS,
  SPLINE_WALL_GEOMETRY_EPSILON,
  type SplineWallGeometryOptions,
  buildSampledSplineWallPathFromGraph,
} from './splineWalls'

type QueryPoint = readonly [number, number]

type QueryBounds = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

type StraightSegmentReference = {
  segmentId: string
  pathId: string
  roomId: string | null
  layerId: string
  wallThickness: number
  wallHeight: number | null
  start: QueryPoint
  end: QueryPoint
  tangent: QueryPoint
  bounds: QueryBounds
  cutouts: readonly SplineWallCutout[]
}

export type SplineWallQueryEdge = {
  start: QueryPoint
  end: QueryPoint
  midpoint: QueryPoint
  tangent: QueryPoint
  normal: QueryPoint
  length: number
  startRatio: number
  endRatio: number
  bounds: QueryBounds
}

export type SplineWallSegmentQueryData = {
  segmentId: string
  pathId: string
  roomId: string | null
  layerId: string
  start: QueryPoint
  end: QueryPoint
  tangent: QueryPoint
  wallThickness: number
  wallHeight: number | null
  cutouts: readonly SplineWallCutout[]
  edges: readonly SplineWallQueryEdge[]
  totalLength: number
  bounds: QueryBounds
}

export type SplineWallRoomQueryData = {
  roomId: string
  layerId: string
  pathIds: readonly string[]
  segmentIds: readonly string[]
  polygons: readonly QueryPoint[][]
  bounds: QueryBounds | null
}

export type SplineWallQueryCache = {
  segments: Record<string, SplineWallSegmentQueryData>
  rooms: Record<string, SplineWallRoomQueryData>
}

export type SplineWallQueryCacheOptions = SplineWallGeometryOptions & {
  roomIds?: ReadonlySet<string> | null
  visibleLayerIds?: ReadonlySet<string> | null
}

export type SplineWallNearestHit = {
  segmentId: string
  pathId: string
  roomId: string | null
  layerId: string
  ratio: number
  distance: number
  centerlinePoint: QueryPoint
  surfacePoint: QueryPoint
  tangent: QueryPoint
  normal: QueryPoint
  wallThickness: number
}

export type SplineWallSegmentSample = {
  segmentId: string
  pathId: string
  roomId: string | null
  layerId: string
  ratio: number
  position: QueryPoint
  tangent: QueryPoint
  normal: QueryPoint
  wallThickness: number
}

export type SplineWallLineHit = {
  segmentId: string
  pathId: string
  roomId: string | null
  layerId: string
  ratio: number
  point: QueryPoint
  distance: number
}

export type FindNearestSplineWallOptions = {
  roomId?: string | null
  maxDistance?: number | null
}

export type FindSplineWallLineHitsOptions = {
  roomId?: string | null
  ignoreCutouts?: boolean
  maxHits?: number
}

export type IsPointInsideBlockingSplineWallOptions = {
  roomId?: string | null
}

type MutableSegmentEntry = {
  segmentId: string
  pathId: string
  roomId: string | null
  layerId: string
  start: QueryPoint
  end: QueryPoint
  tangent: QueryPoint
  wallThickness: number
  wallHeight: number | null
  cutouts: readonly SplineWallCutout[]
  edges: SplineWallQueryEdge[]
}

type MutableRoomEntry = {
  roomId: string
  layerId: string
  pathIds: string[]
  segmentIds: Set<string>
  polygons: QueryPoint[][]
  bounds: QueryBounds | null
}

export function createSplineWallQueryCache(
  splineWallGraph: SplineWallGraph | null | undefined,
  options: SplineWallQueryCacheOptions = {},
): SplineWallQueryCache {
  if (!splineWallGraph) {
    return { segments: {}, rooms: {} }
  }

  const segmentEntries = new Map<string, MutableSegmentEntry>()
  const roomEntries = new Map<string, MutableRoomEntry>()
  const fallbackThickness = options.wallThickness ?? DEFAULT_SPLINE_WALL_THICKNESS

  Object.values(splineWallGraph.paths).forEach((path) => {
    if (options.roomIds && (!path.roomId || !options.roomIds.has(path.roomId))) {
      return
    }
    if (options.visibleLayerIds && !options.visibleLayerIds.has(path.layerId)) {
      return
    }

    const straightSegments = path.segmentIds
      .map((segmentId) => splineWallGraph.segments[segmentId])
      .filter((segment): segment is SplineWallSegment => Boolean(segment))
      .map((segment) => buildStraightSegmentReference(splineWallGraph, segment, fallbackThickness))
      .filter((segment): segment is StraightSegmentReference => Boolean(segment))

    if (straightSegments.length === 0) {
      return
    }

    const sampledPath = buildSampledSplineWallPathFromGraph(path, splineWallGraph, options)
    if (sampledPath.length < (path.closed ? 3 : 2)) {
      return
    }

    if (path.closed && path.roomId) {
      const roomEntry = getOrCreateRoomEntry(roomEntries, path.roomId, path.layerId)
      roomEntry.pathIds.push(path.id)
      roomEntry.polygons.push(sampledPath)
      roomEntry.bounds = mergeBounds(roomEntry.bounds, getBoundsForPoints(sampledPath))
      path.segmentIds.forEach((segmentId) => roomEntry.segmentIds.add(segmentId))
    }

    const edgeCount = path.closed ? sampledPath.length : sampledPath.length - 1
    for (let index = 0; index < edgeCount; index += 1) {
      const start = sampledPath[index]!
      const end = sampledPath[(index + 1) % sampledPath.length]!
      const length = distanceBetweenPoints(start, end)
      if (length <= SPLINE_WALL_GEOMETRY_EPSILON) {
        continue
      }

      const midpoint = lerpPoint(start, end, 0.5)
      const owner = findOwningStraightSegment(midpoint, straightSegments)
      if (!owner) {
        continue
      }

      const edge: SplineWallQueryEdge = {
        start,
        end,
        midpoint,
        tangent: normalizePoint([end[0] - start[0], end[1] - start[1]]),
        normal: perpendicularPoint(normalizePoint([end[0] - start[0], end[1] - start[1]])),
        length,
        startRatio: projectPointToSegmentRatio(start, owner.start, owner.end),
        endRatio: projectPointToSegmentRatio(end, owner.start, owner.end),
        bounds: getBoundsForPoints([start, end]),
      }

      const segmentEntry = getOrCreateSegmentEntry(segmentEntries, owner)
      segmentEntry.edges.push(edge)
    }
  })

  return {
    segments: Object.fromEntries(
      [...segmentEntries.entries()].map(([segmentId, entry]) => {
        const bounds = entry.edges.reduce<QueryBounds | null>(
          (current, edge) => mergeBounds(current, edge.bounds),
          getBoundsForPoints([entry.start, entry.end]),
        )
        const totalLength = entry.edges.reduce((sum, edge) => sum + edge.length, 0)
        return [
          segmentId,
          {
            segmentId: entry.segmentId,
            pathId: entry.pathId,
            roomId: entry.roomId,
            layerId: entry.layerId,
            start: entry.start,
            end: entry.end,
            tangent: entry.tangent,
            wallThickness: entry.wallThickness,
            wallHeight: entry.wallHeight,
            cutouts: entry.cutouts,
            edges: entry.edges,
            totalLength,
            bounds: bounds ?? getBoundsForPoints([entry.start, entry.end]),
          } satisfies SplineWallSegmentQueryData,
        ]
      }),
    ),
    rooms: Object.fromEntries(
      [...roomEntries.entries()].map(([roomId, entry]) => [
        roomId,
        {
          roomId: entry.roomId,
          layerId: entry.layerId,
          pathIds: entry.pathIds,
          segmentIds: [...entry.segmentIds],
          polygons: entry.polygons,
          bounds: entry.bounds,
        } satisfies SplineWallRoomQueryData,
      ]),
    ),
  }
}

export function createActiveSplineWallQueryCache(
  splineWallGraph: SplineWallGraph | null | undefined,
  options: SplineWallQueryCacheOptions = {},
): SplineWallQueryCache | null {
  if (!hasSplineWallGraphPaths(splineWallGraph)) {
    return null
  }

  return createSplineWallQueryCache(splineWallGraph, options)
}

export function getSplineWallSegmentQueryData(
  cache: SplineWallQueryCache,
  segmentId: string,
): SplineWallSegmentQueryData | null {
  return cache.segments[segmentId] ?? null
}

export function getSplineWallRoomQueryData(
  cache: SplineWallQueryCache,
  roomId: string,
): SplineWallRoomQueryData | null {
  return cache.rooms[roomId] ?? null
}

export function findNearestSplineWallSegment(
  cache: SplineWallQueryCache,
  point: QueryPoint,
  options: FindNearestSplineWallOptions = {},
): SplineWallNearestHit | null {
  let nearest: SplineWallNearestHit | null = null
  const roomSegmentIds = options.roomId ? new Set(cache.rooms[options.roomId]?.segmentIds ?? []) : null

  Object.values(cache.segments).forEach((segment) => {
    if (roomSegmentIds && !roomSegmentIds.has(segment.segmentId)) {
      return
    }

    const expandedBounds = expandBounds(segment.bounds, segment.wallThickness)
    if (!isPointInsideBounds(point, expandedBounds)) {
      if (
        options.maxDistance != null
        && distanceToBounds(point, expandedBounds) > options.maxDistance + SPLINE_WALL_GEOMETRY_EPSILON
      ) {
        return
      }
    }

    segment.edges.forEach((edge) => {
      const centerlinePoint = closestPointOnSegment(point, edge.start, edge.end)
      const signedDistance = dotPoint(subtractPoint(point, centerlinePoint), edge.normal)
      const side = signedDistance >= 0 ? 1 : -1
      const surfaceOffset = (segment.wallThickness / 2) * side
      const surfacePoint = addPoint(centerlinePoint, scalePoint(edge.normal, surfaceOffset))
      const distance = distanceBetweenPoints(point, surfacePoint)
      if (options.maxDistance != null && distance > options.maxDistance + SPLINE_WALL_GEOMETRY_EPSILON) {
        return
      }

      if (!nearest || distance < nearest.distance - SPLINE_WALL_GEOMETRY_EPSILON) {
        nearest = {
          segmentId: segment.segmentId,
          pathId: segment.pathId,
          roomId: segment.roomId,
          layerId: segment.layerId,
          ratio: projectPointToSegmentRatio(centerlinePoint, segment.start, segment.end),
          distance,
          centerlinePoint,
          surfacePoint,
          tangent: edge.tangent,
          normal: edge.normal,
          wallThickness: segment.wallThickness,
        }
      }
    })
  })

  return nearest
}

export function sampleSplineWallSegment(
  cache: SplineWallQueryCache,
  segmentId: string,
  ratio: number,
): SplineWallSegmentSample | null {
  const segment = cache.segments[segmentId]
  if (!segment || segment.edges.length === 0) {
    return null
  }

  const clampedRatio = clamp01(ratio)
  const edge = findBestSampleEdge(segment.edges, clampedRatio)
  if (!edge) {
    return null
  }

  const ratioSpan = edge.endRatio - edge.startRatio
  const rawLocal = Math.abs(ratioSpan) <= SPLINE_WALL_GEOMETRY_EPSILON
    ? 0.5
    : (clampedRatio - edge.startRatio) / ratioSpan
  const localRatio = clamp01(rawLocal)
  const position = lerpPoint(edge.start, edge.end, localRatio)

  return {
    segmentId: segment.segmentId,
    pathId: segment.pathId,
    roomId: segment.roomId,
    layerId: segment.layerId,
    ratio: clampedRatio,
    position,
    tangent: edge.tangent,
    normal: edge.normal,
    wallThickness: segment.wallThickness,
  }
}

export function findSplineWallCutoutAtRatio(
  cache: SplineWallQueryCache,
  segmentId: string,
  ratio: number,
): SplineWallCutout | null {
  const segment = cache.segments[segmentId]
  if (!segment) {
    return null
  }

  const clampedRatio = clamp01(ratio)
  return (
    segment.cutouts.find((cutout) => (
      clampedRatio >= cutout.startRatio - SPLINE_WALL_GEOMETRY_EPSILON
      && clampedRatio <= cutout.endRatio + SPLINE_WALL_GEOMETRY_EPSILON
    ))
    ?? null
  )
}

export function findSplineWallLineHits(
  cache: SplineWallQueryCache,
  start: QueryPoint,
  end: QueryPoint,
  options: FindSplineWallLineHitsOptions = {},
): SplineWallLineHit[] {
  const hits: SplineWallLineHit[] = []
  const lineBounds = getBoundsForPoints([start, end])
  const roomSegmentIds = options.roomId ? new Set(cache.rooms[options.roomId]?.segmentIds ?? []) : null

  Object.values(cache.segments).forEach((segment) => {
    if (roomSegmentIds && !roomSegmentIds.has(segment.segmentId)) {
      return
    }
    if (!boundsIntersect(lineBounds, expandBounds(segment.bounds, SPLINE_WALL_GEOMETRY_EPSILON))) {
      return
    }

    segment.edges.forEach((edge) => {
      if (!boundsIntersect(lineBounds, expandBounds(edge.bounds, SPLINE_WALL_GEOMETRY_EPSILON))) {
        return
      }

      const intersection = intersectSegments(start, end, edge.start, edge.end)
      if (!intersection) {
        return
      }
      if (
        intersection.lineRatio <= SPLINE_WALL_GEOMETRY_EPSILON
        || intersection.lineRatio >= 1 - SPLINE_WALL_GEOMETRY_EPSILON
      ) {
        return
      }

      const ratio = projectPointToSegmentRatio(intersection.point, segment.start, segment.end)
      if (!options.ignoreCutouts && findSplineWallCutoutAtRatio(cache, segment.segmentId, ratio)) {
        return
      }

      const hit: SplineWallLineHit = {
        segmentId: segment.segmentId,
        pathId: segment.pathId,
        roomId: segment.roomId,
        layerId: segment.layerId,
        ratio,
        point: intersection.point,
        distance: distanceBetweenPoints(start, intersection.point),
      }
      if (!hasMatchingLineHit(hits, hit)) {
        hits.push(hit)
      }
    })
  })

  hits.sort((left, right) => left.distance - right.distance)
  if (options.maxHits && hits.length > options.maxHits) {
    return hits.slice(0, options.maxHits)
  }
  return hits
}

export function doesLineCrossBlockingSplineWall(
  cache: SplineWallQueryCache,
  start: QueryPoint,
  end: QueryPoint,
  options: FindSplineWallLineHitsOptions = {},
): boolean {
  return findSplineWallLineHits(cache, start, end, {
    ...options,
    maxHits: 1,
  }).length > 0
}

export function isPointInsideBlockingSplineWall(
  cache: SplineWallQueryCache,
  point: QueryPoint,
  options: IsPointInsideBlockingSplineWallOptions = {},
): boolean {
  const roomSegmentIds = options.roomId ? new Set(cache.rooms[options.roomId]?.segmentIds ?? []) : null

  return Object.values(cache.segments).some((segment) => {
    if (roomSegmentIds && !roomSegmentIds.has(segment.segmentId)) {
      return false
    }

    const expandedBounds = expandBounds(segment.bounds, segment.wallThickness / 2)
    if (!isPointInsideBounds(point, expandedBounds)) {
      return false
    }

    return segment.edges.some((edge) => {
      const edgeBounds = expandBounds(edge.bounds, segment.wallThickness / 2)
      if (!isPointInsideBounds(point, edgeBounds)) {
        return false
      }

      const centerlinePoint = closestPointOnSegment(point, edge.start, edge.end)
      if (distanceBetweenPoints(point, centerlinePoint) > (segment.wallThickness / 2) + SPLINE_WALL_GEOMETRY_EPSILON) {
        return false
      }

      const ratio = projectPointToSegmentRatio(centerlinePoint, segment.start, segment.end)
      return !findSplineWallCutoutAtRatio(cache, segment.segmentId, ratio)
    })
  })
}

export function isPointInsideSplineRoom(
  cache: SplineWallQueryCache,
  roomId: string,
  point: QueryPoint,
): boolean {
  const room = cache.rooms[roomId]
  if (!room) {
    return false
  }

  return room.polygons.some((polygon) => isPointInsidePolygon(point, polygon))
}

export function getSplineRoomCellCoverage(
  cache: SplineWallQueryCache,
  roomId: string,
  cell: GridCell,
  sampleResolution = 4,
): number {
  const room = cache.rooms[roomId]
  if (!room || room.polygons.length === 0) {
    return 0
  }

  const resolution = Math.max(1, Math.floor(sampleResolution))
  let insideCount = 0
  const sampleCount = resolution * resolution
  const minX = cell[0] * GRID_SIZE
  const minZ = cell[1] * GRID_SIZE
  const step = GRID_SIZE / resolution

  for (let z = 0; z < resolution; z += 1) {
    for (let x = 0; x < resolution; x += 1) {
      const samplePoint: QueryPoint = [
        minX + (x + 0.5) * step,
        minZ + (z + 0.5) * step,
      ]
      if (room.polygons.some((polygon) => isPointInsidePolygon(samplePoint, polygon))) {
        insideCount += 1
      }
    }
  }

  return insideCount / sampleCount
}

function getOrCreateSegmentEntry(
  segmentEntries: Map<string, MutableSegmentEntry>,
  owner: StraightSegmentReference,
): MutableSegmentEntry {
  const existing = segmentEntries.get(owner.segmentId)
  if (existing) {
    return existing
  }

  const created: MutableSegmentEntry = {
    segmentId: owner.segmentId,
    pathId: owner.pathId,
    roomId: owner.roomId,
    layerId: owner.layerId,
    start: owner.start,
    end: owner.end,
    tangent: owner.tangent,
    wallThickness: owner.wallThickness,
    wallHeight: owner.wallHeight,
    cutouts: owner.cutouts,
    edges: [],
  }
  segmentEntries.set(owner.segmentId, created)
  return created
}

function getOrCreateRoomEntry(
  roomEntries: Map<string, MutableRoomEntry>,
  roomId: string,
  layerId: string,
): MutableRoomEntry {
  const existing = roomEntries.get(roomId)
  if (existing) {
    return existing
  }

  const created: MutableRoomEntry = {
    roomId,
    layerId,
    pathIds: [],
    segmentIds: new Set(),
    polygons: [],
    bounds: null,
  }
  roomEntries.set(roomId, created)
  return created
}

function buildStraightSegmentReference(
  splineWallGraph: SplineWallGraph,
  segment: SplineWallSegment,
  fallbackThickness: number,
): StraightSegmentReference | null {
  const startNode = splineWallGraph.nodes[segment.startNodeId]
  const endNode = splineWallGraph.nodes[segment.endNodeId]
  if (!startNode || !endNode) {
    return null
  }

  const start: QueryPoint = [startNode.position[0] * GRID_SIZE, startNode.position[1] * GRID_SIZE]
  const end: QueryPoint = [endNode.position[0] * GRID_SIZE, endNode.position[1] * GRID_SIZE]
  const tangent = normalizePoint([end[0] - start[0], end[1] - start[1]])

  return {
    segmentId: segment.id,
    pathId: segment.pathId,
    roomId: segment.roomId,
    layerId: segment.layerId,
    wallThickness: segment.wallThickness ?? fallbackThickness,
    wallHeight: segment.wallHeight,
    start,
    end,
    tangent,
    bounds: getBoundsForPoints([start, end]),
    cutouts: segment.cutouts,
  }
}

function findOwningStraightSegment(
  midpoint: QueryPoint,
  candidates: readonly StraightSegmentReference[],
): StraightSegmentReference | null {
  let owner: StraightSegmentReference | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  let bestAlignment = Number.NEGATIVE_INFINITY

  candidates.forEach((candidate) => {
    const distance = distancePointToSegment(midpoint, candidate.start, candidate.end)
    if (distance > bestDistance + SPLINE_WALL_GEOMETRY_EPSILON) {
      return
    }

    const offset = subtractPoint(midpoint, closestPointOnSegment(midpoint, candidate.start, candidate.end))
    const alignment = Math.abs(dotPoint(normalizePoint(offset), candidate.tangent))
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

function findBestSampleEdge(
  edges: readonly SplineWallQueryEdge[],
  ratio: number,
): SplineWallQueryEdge | null {
  let match: SplineWallQueryEdge | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  edges.forEach((edge) => {
    const minRatio = Math.min(edge.startRatio, edge.endRatio)
    const maxRatio = Math.max(edge.startRatio, edge.endRatio)
    if (ratio >= minRatio - SPLINE_WALL_GEOMETRY_EPSILON && ratio <= maxRatio + SPLINE_WALL_GEOMETRY_EPSILON) {
      match = edge
      bestDistance = 0
      return
    }

    const distance = Math.min(Math.abs(ratio - minRatio), Math.abs(ratio - maxRatio))
    if (distance < bestDistance) {
      bestDistance = distance
      match = edge
    }
  })

  return match
}

function isPointInsidePolygon(point: QueryPoint, polygon: readonly QueryPoint[]) {
  if (polygon.length < 3) {
    return false
  }

  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    if (isPointOnSegment(point, polygon[previousIndex]!, polygon[index]!)) {
      return true
    }
  }

  let inside = false
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index]!
    const previous = polygon[previousIndex]!
    const intersects = ((current[1] > point[1]) !== (previous[1] > point[1]))
      && (point[0] < ((previous[0] - current[0]) * (point[1] - current[1])) / ((previous[1] - current[1]) || SPLINE_WALL_GEOMETRY_EPSILON) + current[0])
    if (intersects) {
      inside = !inside
    }
  }
  return inside
}

function isPointOnSegment(point: QueryPoint, start: QueryPoint, end: QueryPoint) {
  const segmentLength = distanceBetweenPoints(start, end)
  if (segmentLength <= SPLINE_WALL_GEOMETRY_EPSILON) {
    return distanceBetweenPoints(point, start) <= SPLINE_WALL_GEOMETRY_EPSILON
  }

  const cross = (point[0] - start[0]) * (end[1] - start[1]) - (point[1] - start[1]) * (end[0] - start[0])
  if (Math.abs(cross) > SPLINE_WALL_GEOMETRY_EPSILON) {
    return false
  }

  const dot = (point[0] - start[0]) * (end[0] - start[0]) + (point[1] - start[1]) * (end[1] - start[1])
  if (dot < -SPLINE_WALL_GEOMETRY_EPSILON) {
    return false
  }

  return dot <= segmentLength * segmentLength + SPLINE_WALL_GEOMETRY_EPSILON
}

function intersectSegments(
  startA: QueryPoint,
  endA: QueryPoint,
  startB: QueryPoint,
  endB: QueryPoint,
): { point: QueryPoint, lineRatio: number } | null {
  const directionA = subtractPoint(endA, startA)
  const directionB = subtractPoint(endB, startB)
  const determinant = crossPoint(directionA, directionB)
  if (Math.abs(determinant) <= SPLINE_WALL_GEOMETRY_EPSILON) {
    return null
  }

  const offset = subtractPoint(startB, startA)
  const t = crossPoint(offset, directionB) / determinant
  const u = crossPoint(offset, directionA) / determinant
  if (
    t < -SPLINE_WALL_GEOMETRY_EPSILON
    || t > 1 + SPLINE_WALL_GEOMETRY_EPSILON
    || u < -SPLINE_WALL_GEOMETRY_EPSILON
    || u > 1 + SPLINE_WALL_GEOMETRY_EPSILON
  ) {
    return null
  }

  return {
    point: lerpPoint(startA, endA, t),
    lineRatio: t,
  }
}

function hasMatchingLineHit(
  hits: readonly SplineWallLineHit[],
  candidate: SplineWallLineHit,
) {
  return hits.some((hit) => (
    hit.segmentId === candidate.segmentId
    && distanceBetweenPoints(hit.point, candidate.point) <= SPLINE_WALL_GEOMETRY_EPSILON
  ))
}

function projectPointToSegmentRatio(point: QueryPoint, start: QueryPoint, end: QueryPoint) {
  const delta = subtractPoint(end, start)
  const lengthSquared = dotPoint(delta, delta)
  if (lengthSquared <= SPLINE_WALL_GEOMETRY_EPSILON) {
    return 0
  }

  return clamp01(dotPoint(subtractPoint(point, start), delta) / lengthSquared)
}

function closestPointOnSegment(point: QueryPoint, start: QueryPoint, end: QueryPoint): QueryPoint {
  return lerpPoint(start, end, projectPointToSegmentRatio(point, start, end))
}

function distancePointToSegment(point: QueryPoint, start: QueryPoint, end: QueryPoint) {
  return distanceBetweenPoints(point, closestPointOnSegment(point, start, end))
}

function normalizePoint(point: QueryPoint): QueryPoint {
  const length = Math.hypot(point[0], point[1])
  if (length <= SPLINE_WALL_GEOMETRY_EPSILON) {
    return [0, 0]
  }
  return [point[0] / length, point[1] / length]
}

function perpendicularPoint(point: QueryPoint): QueryPoint {
  return [-point[1], point[0]]
}

function subtractPoint(left: QueryPoint, right: QueryPoint): QueryPoint {
  return [left[0] - right[0], left[1] - right[1]]
}

function addPoint(left: QueryPoint, right: QueryPoint): QueryPoint {
  return [left[0] + right[0], left[1] + right[1]]
}

function scalePoint(point: QueryPoint, scale: number): QueryPoint {
  return [point[0] * scale, point[1] * scale]
}

function lerpPoint(start: QueryPoint, end: QueryPoint, t: number): QueryPoint {
  return [
    start[0] + (end[0] - start[0]) * t,
    start[1] + (end[1] - start[1]) * t,
  ]
}

function dotPoint(left: QueryPoint, right: QueryPoint) {
  return left[0] * right[0] + left[1] * right[1]
}

function crossPoint(left: QueryPoint, right: QueryPoint) {
  return left[0] * right[1] - left[1] * right[0]
}

function distanceBetweenPoints(left: QueryPoint, right: QueryPoint) {
  return Math.hypot(left[0] - right[0], left[1] - right[1])
}

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1)
}

function getBoundsForPoints(points: readonly QueryPoint[]): QueryBounds {
  return points.reduce<QueryBounds>(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point[0]),
      maxX: Math.max(bounds.maxX, point[0]),
      minZ: Math.min(bounds.minZ, point[1]),
      maxZ: Math.max(bounds.maxZ, point[1]),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minZ: Number.POSITIVE_INFINITY,
      maxZ: Number.NEGATIVE_INFINITY,
    },
  )
}

function mergeBounds(left: QueryBounds | null, right: QueryBounds | null) {
  if (!left) {
    return right
  }
  if (!right) {
    return left
  }
  return {
    minX: Math.min(left.minX, right.minX),
    maxX: Math.max(left.maxX, right.maxX),
    minZ: Math.min(left.minZ, right.minZ),
    maxZ: Math.max(left.maxZ, right.maxZ),
  }
}

function expandBounds(bounds: QueryBounds, amount: number): QueryBounds {
  return {
    minX: bounds.minX - amount,
    maxX: bounds.maxX + amount,
    minZ: bounds.minZ - amount,
    maxZ: bounds.maxZ + amount,
  }
}

function isPointInsideBounds(point: QueryPoint, bounds: QueryBounds) {
  return (
    point[0] >= bounds.minX - SPLINE_WALL_GEOMETRY_EPSILON
    && point[0] <= bounds.maxX + SPLINE_WALL_GEOMETRY_EPSILON
    && point[1] >= bounds.minZ - SPLINE_WALL_GEOMETRY_EPSILON
    && point[1] <= bounds.maxZ + SPLINE_WALL_GEOMETRY_EPSILON
  )
}

function distanceToBounds(point: QueryPoint, bounds: QueryBounds) {
  const dx = point[0] < bounds.minX
    ? bounds.minX - point[0]
    : point[0] > bounds.maxX
      ? point[0] - bounds.maxX
      : 0
  const dz = point[1] < bounds.minZ
    ? bounds.minZ - point[1]
    : point[1] > bounds.maxZ
      ? point[1] - bounds.maxZ
      : 0
  return Math.hypot(dx, dz)
}

function boundsIntersect(left: QueryBounds, right: QueryBounds) {
  return !(
    left.maxX < right.minX - SPLINE_WALL_GEOMETRY_EPSILON
    || left.minX > right.maxX + SPLINE_WALL_GEOMETRY_EPSILON
    || left.maxZ < right.minZ - SPLINE_WALL_GEOMETRY_EPSILON
    || left.minZ > right.maxZ + SPLINE_WALL_GEOMETRY_EPSILON
  )
}
