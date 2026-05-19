import { GRID_SIZE } from '../hooks/useSnapToGrid'
import type { SplineWallGraph, SplineWallPath } from './splineWallGraph'
import {
  createSplineWallQueryCache,
  getSplineWallSegmentQueryData,
  isPointInsideSplineRoom,
  sampleSplineWallSegment,
  type SplineWallQueryCache,
} from './splineWallQueries'
import {
  buildSampledSplineWallPathFromGraph,
  SPLINE_WALL_GEOMETRY_EPSILON,
} from './splineWalls'
import { findOwningStraightSegmentCandidate } from './splineWallStraightSegmentOwnership'
import type { SplineWallSegmentSide } from './wallStyleAssignments'

type WorldPoint = readonly [number, number]
type PathWinding = 'clockwise' | 'counterclockwise'

export type SplineWallBoundaryFaceKind = 'room-face' | 'exterior-face'
export type SplineWallBoundaryAnchorKind =
  | 'start'
  | 'end'
  | 'convex-corner'
  | 'concave-corner'
  | 'curvature-change'

export type AnalyzedSplineWallBoundarySection = {
  id: string
  pathId: string
  segmentId: string
  roomId: string | null
  oppositeRoomId: string | null
  side: SplineWallSegmentSide
  faceKind: SplineWallBoundaryFaceKind
  wallKey: string | null
  sharedSegmentIds: readonly string[]
  start: WorldPoint
  end: WorldPoint
  length: number
  startRatio: number
  endRatio: number
}

export type AnalyzedSplineWallBoundaryAnchor = {
  id: string
  pathId: string
  segmentId: string
  roomId: string | null
  side: SplineWallSegmentSide
  kind: SplineWallBoundaryAnchorKind
  position: WorldPoint
}

export type AnalyzedSplineWallBoundaryPath = {
  pathId: string
  roomId: string | null
  winding: PathWinding
  roomSide: SplineWallSegmentSide
  exteriorSide: SplineWallSegmentSide
  sections: AnalyzedSplineWallBoundarySection[]
  anchors: AnalyzedSplineWallBoundaryAnchor[]
}

type SharedSegmentGroup = {
  segmentIds: string[]
  roomIds: string[]
}
type SharedSegmentSpan = SharedSegmentGroup & {
  startRatio: number
  endRatio: number
}
type StraightSegmentReference = {
  segmentId: string
  roomId: string | null
  layerId: string
  hasCurvedEndpoint: boolean
  start: WorldPoint
  end: WorldPoint
  tangent: WorldPoint
}
type SampledSharedEdge = {
  segmentId: string
  roomId: string | null
  startRatio: number
  endRatio: number
}
type ExteriorOverlapSpan = {
  startRatio: number
  endRatio: number
  oppositeRoomId: string | null
}

const MIN_CORNER_INSERT_TURN_RADIANS = Math.PI / 6

export function analyzeSplineWallGraphBoundaries(
  splineWallGraph: SplineWallGraph,
  visibleLayerIds: ReadonlySet<string> | null = null,
): AnalyzedSplineWallBoundaryPath[] {
  const sharedSegmentGroups = buildSharedSegmentGroups(splineWallGraph, visibleLayerIds)
  const queryCache = createSplineWallQueryCache(
    splineWallGraph,
    visibleLayerIds ? { visibleLayerIds } : {},
  )

  return Object.values(splineWallGraph.paths)
    .filter((path) => !visibleLayerIds || visibleLayerIds.has(path.layerId))
    .flatMap((path) => {
      const analysis = analyzeSplineWallPath(path, splineWallGraph, sharedSegmentGroups, queryCache)
      return analysis ? [analysis] : []
    })
}

function analyzeSplineWallPath(
  path: SplineWallPath,
  splineWallGraph: SplineWallGraph,
  sharedSegmentGroups: ReadonlyMap<string, readonly SharedSegmentSpan[]>,
  queryCache: SplineWallQueryCache,
): AnalyzedSplineWallBoundaryPath | null {
  const points = path.nodeIds.reduce<WorldPoint[]>((accumulator, nodeId) => {
    const point = splineWallGraph.nodes[nodeId]?.position
    if (point) {
      accumulator.push([point[0], point[1]])
    }
    return accumulator
  }, [])
  if (points.length < 2) {
    return null
  }

  const winding = getPathWinding(points, path.closed)
  const roomSide: SplineWallSegmentSide = winding === 'counterclockwise' ? 'left' : 'right'
  const exteriorSide: SplineWallSegmentSide = roomSide === 'left' ? 'right' : 'left'

  const sections: AnalyzedSplineWallBoundarySection[] = []
  path.segmentIds.forEach((segmentId) => {
    const segment = splineWallGraph.segments[segmentId]
    if (!segment) {
      return
    }

    const start = splineWallGraph.nodes[segment.startNodeId]?.position
    const end = splineWallGraph.nodes[segment.endNodeId]?.position
    if (!start || !end) {
      return
    }

    const sharedSpans = sharedSegmentGroups.get(segment.id) ?? []
    const sectionSpans = buildSegmentSectionSpans(sharedSpans)
    sectionSpans.forEach((span) => {
      const overlapSpans = span.sharedGroup
        ? [{
            startRatio: span.startRatio,
            endRatio: span.endRatio,
            oppositeRoomId: span.sharedGroup.roomIds.find((roomId) => roomId !== segment.roomId) ?? null,
          }]
        : resolveExteriorOverlapSpans(
            queryCache,
            path.layerId,
            segment.roomId,
            segment.id,
            span.startRatio,
            span.endRatio,
            exteriorSide,
          )

      overlapSpans.forEach((overlapSpan) => {
        const overlapStart = getBoundarySectionPoint(queryCache, segment.id, overlapSpan.startRatio, start, end)
        const overlapEnd = getBoundarySectionPoint(queryCache, segment.id, overlapSpan.endRatio, start, end)
        const overlapLength = Math.hypot(overlapEnd[0] - overlapStart[0], overlapEnd[1] - overlapStart[1])
        const sharedSegmentIds = overlapSpan.oppositeRoomId ? (span.sharedGroup?.segmentIds ?? [segment.id]) : [segment.id]
        const sectionIdSuffix = `${overlapSpan.startRatio.toFixed(6)}:${overlapSpan.endRatio.toFixed(6)}`

        sections.push({
          id: `${segment.id}:room-face:${sectionIdSuffix}`,
          pathId: path.id,
          segmentId: segment.id,
          roomId: segment.roomId,
          oppositeRoomId: overlapSpan.oppositeRoomId,
          side: roomSide,
          faceKind: 'room-face',
          wallKey: segment.wallKey,
          sharedSegmentIds,
          start: overlapStart,
          end: overlapEnd,
          length: overlapLength,
          startRatio: overlapSpan.startRatio,
          endRatio: overlapSpan.endRatio,
        })

        if (overlapSpan.oppositeRoomId === null) {
          sections.push({
            id: `${segment.id}:exterior-face:${sectionIdSuffix}`,
            pathId: path.id,
            segmentId: segment.id,
            roomId: segment.roomId,
            oppositeRoomId: null,
            side: exteriorSide,
            faceKind: 'exterior-face',
            wallKey: segment.wallKey,
            sharedSegmentIds,
            start: overlapStart,
            end: overlapEnd,
            length: overlapLength,
            startRatio: overlapSpan.startRatio,
            endRatio: overlapSpan.endRatio,
          })
        }
      })
    })
  })

  const anchors = buildPathAnchors(path, splineWallGraph, roomSide, winding)

  return {
    pathId: path.id,
    roomId: path.roomId,
    winding,
    roomSide,
    exteriorSide,
    sections,
    anchors,
  }
}

function buildPathAnchors(
  path: SplineWallPath,
  splineWallGraph: SplineWallGraph,
  roomSide: SplineWallSegmentSide,
  winding: PathWinding,
) {
  const anchors: AnalyzedSplineWallBoundaryAnchor[] = []
  const nodeCount = path.nodeIds.length
  if (nodeCount === 0) {
    return anchors
  }

  if (!path.closed) {
    const startNodeId = path.nodeIds[0]!
    const endNodeId = path.nodeIds[nodeCount - 1]!
    const startPosition = splineWallGraph.nodes[startNodeId]?.position
    const endPosition = splineWallGraph.nodes[endNodeId]?.position
    const firstSegmentId = path.segmentIds[0]
    const lastSegmentId = path.segmentIds[path.segmentIds.length - 1]
    if (startPosition && firstSegmentId) {
      anchors.push({
        id: `${path.id}:start`,
        pathId: path.id,
        segmentId: firstSegmentId,
        roomId: path.roomId,
        side: roomSide,
        kind: 'start',
        position: [startPosition[0], startPosition[1]],
      })
    }
    if (endPosition && lastSegmentId) {
      anchors.push({
        id: `${path.id}:end`,
        pathId: path.id,
        segmentId: lastSegmentId,
        roomId: path.roomId,
        side: roomSide,
        kind: 'end',
        position: [endPosition[0], endPosition[1]],
      })
    }
  }

  path.nodeIds.forEach((nodeId, index) => {
    const node = splineWallGraph.nodes[nodeId]
    if (!node) {
      return
    }

    const previousIndex = index - 1
    const nextIndex = index + 1
    const hasPrevious = path.closed || previousIndex >= 0
    const hasNext = path.closed || nextIndex < nodeCount

    if (hasPrevious && hasNext) {
      const previousNode = splineWallGraph.nodes[path.nodeIds[(previousIndex + nodeCount) % nodeCount]!]
      const nextNode = splineWallGraph.nodes[path.nodeIds[nextIndex % nodeCount]!]
      const segmentId = path.segmentIds[index % path.segmentIds.length]
      if (previousNode && nextNode && segmentId) {
        const cross = crossProduct(
          [
            node.position[0] - previousNode.position[0],
            node.position[1] - previousNode.position[1],
          ],
          [
            nextNode.position[0] - node.position[0],
            nextNode.position[1] - node.position[1],
          ],
        )
        if (Math.abs(cross) > 1e-6 && getTurnAngleRadians(previousNode.position, node.position, nextNode.position) >= MIN_CORNER_INSERT_TURN_RADIANS) {
          const convex = winding === 'counterclockwise' ? cross > 0 : cross < 0
          anchors.push({
            id: `${path.id}:${nodeId}:${convex ? 'convex' : 'concave'}`,
            pathId: path.id,
            segmentId,
            roomId: path.roomId,
            side: roomSide,
            kind: convex ? 'convex-corner' : 'concave-corner',
            position: [node.position[0], node.position[1]],
          })
        }
      }
    }

    if ((node.cornerMode === 'rounded' || node.cornerMode === 'diagonal') && path.segmentIds.length > 0) {
      const segmentId = path.segmentIds[index % path.segmentIds.length] ?? path.segmentIds[0]!
      anchors.push({
        id: `${path.id}:${nodeId}:curvature`,
        pathId: path.id,
        segmentId,
        roomId: path.roomId,
        side: roomSide,
        kind: 'curvature-change',
        position: [node.position[0], node.position[1]],
      })
    }
  })

  return anchors
}

function buildSharedSegmentGroups(
  splineWallGraph: SplineWallGraph,
  visibleLayerIds: ReadonlySet<string> | null,
) {
  const groupsBySegmentId = new Map<string, SharedSegmentSpan[]>()
  const segmentsByGeometryKey = new Map<string, typeof splineWallGraph.segments[string][]>()
  const straightSegments = Object.values(splineWallGraph.segments)
    .filter((segment) => !visibleLayerIds || visibleLayerIds.has(segment.layerId))
    .map((segment) => buildStraightSegmentReference(splineWallGraph, segment.id))
    .filter((segment): segment is StraightSegmentReference => Boolean(segment))

  Object.values(splineWallGraph.segments).forEach((segment) => {
    if (visibleLayerIds && !visibleLayerIds.has(segment.layerId)) {
      return
    }

    const start = splineWallGraph.nodes[segment.startNodeId]?.position
    const end = splineWallGraph.nodes[segment.endNodeId]?.position
    if (!start || !end) {
      return
    }

    const geometryKey = toSegmentGeometryKey(start, end)
    const existing = segmentsByGeometryKey.get(geometryKey)
    if (existing) {
      existing.push(segment)
    } else {
      segmentsByGeometryKey.set(geometryKey, [segment])
    }
  })

  segmentsByGeometryKey.forEach((segments) => {
    if (segments.length < 2) {
      return
    }

    const roomIds = [...new Set(
      segments
        .map((segment) => segment.roomId)
        .filter((roomId): roomId is string => typeof roomId === 'string'),
    )]
    if (roomIds.length < 2) {
      return
    }

    const segmentIds = [...new Set(segments.map((segment) => segment.id))]
    addSharedSegmentGroup(groupsBySegmentId, segmentIds, roomIds, 0, 1)
  })

  addStraightSharedSegmentOverlapGroups(groupsBySegmentId, straightSegments)

  const sampledEdgesByGeometryKey = buildSampledSharedEdgesByGeometryKey(splineWallGraph, visibleLayerIds)
  sampledEdgesByGeometryKey.forEach((edges) => {
    if (edges.length < 2) {
      return
    }

    const roomIds = [...new Set(
      edges
        .map((edge) => edge.roomId)
        .filter((roomId): roomId is string => typeof roomId === 'string'),
    )]
    if (roomIds.length < 2) {
      return
    }

    edges.forEach((edge) => {
      addSharedSegmentGroup(
        groupsBySegmentId,
        [...new Set(edges.map((candidate) => candidate.segmentId))],
        roomIds,
        Math.min(edge.startRatio, edge.endRatio),
        Math.max(edge.startRatio, edge.endRatio),
        edge.segmentId,
      )
    })
  })

  return groupsBySegmentId
}

function buildSampledSharedEdgesByGeometryKey(
  splineWallGraph: SplineWallGraph,
  visibleLayerIds: ReadonlySet<string> | null,
) {
  const sampledEdgesByGeometryKey = new Map<string, SampledSharedEdge[]>()
  Object.values(splineWallGraph.paths).forEach((path) => {
    if (visibleLayerIds && !visibleLayerIds.has(path.layerId)) {
      return
    }

    const straightSegments = path.segmentIds
      .map((segmentId) => buildStraightSegmentReference(splineWallGraph, segmentId))
      .filter((segment): segment is StraightSegmentReference => Boolean(segment))
    if (straightSegments.length === 0) {
      return
    }

    const sampledPath = buildSampledSplineWallPathFromGraph(path, splineWallGraph)
    const edgeCount = path.closed ? sampledPath.length : sampledPath.length - 1
    for (let index = 0; index < edgeCount; index += 1) {
      const start = sampledPath[index]
      const end = sampledPath[(index + 1) % sampledPath.length]
      if (!start || !end || Math.hypot(end[0] - start[0], end[1] - start[1]) <= SPLINE_WALL_GEOMETRY_EPSILON) {
        continue
      }

      const ownerSegment = findOwningStraightSegment(
        [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2],
        straightSegments,
      )
      if (!ownerSegment) {
        continue
      }

      const geometryKey = toSampledSegmentGeometryKey(path.layerId, start, end)
      const existing = sampledEdgesByGeometryKey.get(geometryKey)
      const edge = {
        segmentId: ownerSegment.segmentId,
        roomId: ownerSegment.roomId,
        startRatio: projectPointToSegmentRatio(start, ownerSegment.start, ownerSegment.end),
        endRatio: projectPointToSegmentRatio(end, ownerSegment.start, ownerSegment.end),
      }
      if (existing) {
        existing.push(edge)
      } else {
        sampledEdgesByGeometryKey.set(geometryKey, [edge])
      }
    }
  })

  return sampledEdgesByGeometryKey
}

function addSharedSegmentGroup(
  groupsBySegmentId: Map<string, SharedSegmentSpan[]>,
  segmentIds: readonly string[],
  roomIds: readonly string[],
  startRatio: number,
  endRatio: number,
  ownerSegmentId: string | null = null,
) {
  const targetSegmentIds = ownerSegmentId ? [ownerSegmentId] : segmentIds
  targetSegmentIds.forEach((segmentId) => {
    const mergedSegmentIds = new Set(segmentIds)
    const mergedRoomIds = new Set(roomIds)
    const existing = groupsBySegmentId.get(segmentId)
    existing?.forEach((span) => {
      if (rangesOverlapOrTouch(startRatio, endRatio, span.startRatio, span.endRatio)) {
        span.segmentIds.forEach((existingSegmentId) => mergedSegmentIds.add(existingSegmentId))
        span.roomIds.forEach((existingRoomId) => mergedRoomIds.add(existingRoomId))
      }
    })
    groupsBySegmentId.set(segmentId, mergeSharedSegmentSpans([
      ...(existing ?? []),
      {
        segmentIds: [...mergedSegmentIds],
        roomIds: [...mergedRoomIds],
        startRatio,
        endRatio,
      },
    ]))
  })
}

function buildStraightSegmentReference(
  splineWallGraph: SplineWallGraph,
  segmentId: string,
): StraightSegmentReference | null {
  const segment = splineWallGraph.segments[segmentId]
  const startNode = splineWallGraph.nodes[segment?.startNodeId ?? '']
  const endNode = splineWallGraph.nodes[segment?.endNodeId ?? '']
  if (!segment || !startNode || !endNode) {
    return null
  }

  const start = startNode.position
  const end = endNode.position
  return {
    segmentId: segment.id,
    roomId: segment.roomId,
    layerId: segment.layerId,
    hasCurvedEndpoint: hasCurvedSplineWallNode(startNode) || hasCurvedSplineWallNode(endNode),
    start: boundaryPointToWorldPoint(start),
    end: boundaryPointToWorldPoint(end),
    tangent: normalizePoint(subtractPoints(boundaryPointToWorldPoint(end), boundaryPointToWorldPoint(start))),
  }
}

function hasCurvedSplineWallNode(node: { cornerMode?: string | null; cornerAmount?: number | null }) {
  return node.cornerMode !== 'square' && (node.cornerAmount ?? 0) > SPLINE_WALL_GEOMETRY_EPSILON
}

function addStraightSharedSegmentOverlapGroups(
  groupsBySegmentId: Map<string, SharedSegmentSpan[]>,
  segments: readonly StraightSegmentReference[],
) {
  for (let leftIndex = 0; leftIndex < segments.length; leftIndex += 1) {
    const left = segments[leftIndex]!
    for (let rightIndex = leftIndex + 1; rightIndex < segments.length; rightIndex += 1) {
      const right = segments[rightIndex]!
      if (
        left.layerId !== right.layerId
        || left.roomId === right.roomId
        || left.hasCurvedEndpoint
        || right.hasCurvedEndpoint
      ) {
        continue
      }

      const overlap = getCollinearSegmentOverlap(left, right)
      if (!overlap) {
        continue
      }

      const roomIds = [left.roomId, right.roomId].filter((roomId): roomId is string => Boolean(roomId))
      if (roomIds.length < 2) {
        continue
      }

      const segmentIds = [left.segmentId, right.segmentId]
      addSharedSegmentGroup(
        groupsBySegmentId,
        segmentIds,
        roomIds,
        overlap.leftStartRatio,
        overlap.leftEndRatio,
        left.segmentId,
      )
      addSharedSegmentGroup(
        groupsBySegmentId,
        segmentIds,
        roomIds,
        overlap.rightStartRatio,
        overlap.rightEndRatio,
        right.segmentId,
      )
    }
  }
}

function getCollinearSegmentOverlap(
  left: StraightSegmentReference,
  right: StraightSegmentReference,
) {
  const leftDelta = subtractPoints(left.end, left.start)
  const rightDelta = subtractPoints(right.end, right.start)
  if (
    magnitudeSquared(leftDelta) <= SPLINE_WALL_GEOMETRY_EPSILON
    || magnitudeSquared(rightDelta) <= SPLINE_WALL_GEOMETRY_EPSILON
    || Math.abs(crossProduct(leftDelta, rightDelta)) > SPLINE_WALL_GEOMETRY_EPSILON
    || Math.abs(crossProduct(leftDelta, subtractPoints(right.start, left.start))) > SPLINE_WALL_GEOMETRY_EPSILON
  ) {
    return null
  }

  const rightStartOnLeft = projectPointToSegmentRatio(right.start, left.start, left.end)
  const rightEndOnLeft = projectPointToSegmentRatio(right.end, left.start, left.end)
  const leftOverlapStartRatio = Math.max(0, Math.min(rightStartOnLeft, rightEndOnLeft))
  const leftOverlapEndRatio = Math.min(1, Math.max(rightStartOnLeft, rightEndOnLeft))
  if (leftOverlapEndRatio - leftOverlapStartRatio <= SPLINE_WALL_GEOMETRY_EPSILON) {
    return null
  }

  const overlapStart = interpolateWorldPoint(left.start, left.end, leftOverlapStartRatio)
  const overlapEnd = interpolateWorldPoint(left.start, left.end, leftOverlapEndRatio)
  const rightOverlapStartRatio = projectPointToSegmentRatio(overlapStart, right.start, right.end)
  const rightOverlapEndRatio = projectPointToSegmentRatio(overlapEnd, right.start, right.end)

  return {
    leftStartRatio: leftOverlapStartRatio,
    leftEndRatio: leftOverlapEndRatio,
    rightStartRatio: Math.min(rightOverlapStartRatio, rightOverlapEndRatio),
    rightEndRatio: Math.max(rightOverlapStartRatio, rightOverlapEndRatio),
  }
}

function boundaryPointToWorldPoint(point: WorldPoint): WorldPoint {
  return [point[0] * GRID_SIZE, point[1] * GRID_SIZE]
}

function findOwningStraightSegment(
  point: WorldPoint,
  straightSegments: readonly StraightSegmentReference[],
): StraightSegmentReference | null {
  return findOwningStraightSegmentCandidate(point, straightSegments, SPLINE_WALL_GEOMETRY_EPSILON)
}

function projectPointToSegmentRatio(
  point: WorldPoint,
  start: WorldPoint,
  end: WorldPoint,
) {
  const deltaX = end[0] - start[0]
  const deltaY = end[1] - start[1]
  const lengthSquared = (deltaX * deltaX) + (deltaY * deltaY)
  if (lengthSquared <= 1e-8) {
    return 0
  }

  return clampRatio((((point[0] - start[0]) * deltaX) + ((point[1] - start[1]) * deltaY)) / lengthSquared)
}

function buildSegmentSectionSpans(sharedSpans: readonly SharedSegmentSpan[]) {
  const normalizedSharedSpans = mergeSharedSegmentSpans(sharedSpans)
  const sectionSpans: Array<{
    startRatio: number
    endRatio: number
    sharedGroup: SharedSegmentGroup | null
  }> = []
  let cursor = 0

  normalizedSharedSpans.forEach((span) => {
    if (span.startRatio > cursor + 1e-5) {
      sectionSpans.push({
        startRatio: cursor,
        endRatio: span.startRatio,
        sharedGroup: null,
      })
    }
    sectionSpans.push({
      startRatio: span.startRatio,
      endRatio: span.endRatio,
      sharedGroup: {
        segmentIds: span.segmentIds,
        roomIds: span.roomIds,
      },
    })
    cursor = Math.max(cursor, span.endRatio)
  })

  if (cursor < 1 - 1e-5) {
    sectionSpans.push({
      startRatio: cursor,
      endRatio: 1,
      sharedGroup: null,
    })
  }

  return sectionSpans.filter((span) => span.endRatio - span.startRatio > 1e-5)
}

function mergeSharedSegmentSpans(spans: readonly SharedSegmentSpan[]) {
  const sorted = spans
    .map((span) => ({
      ...span,
      startRatio: clampRatio(Math.min(span.startRatio, span.endRatio)),
      endRatio: clampRatio(Math.max(span.startRatio, span.endRatio)),
    }))
    .filter((span) => span.endRatio - span.startRatio > 1e-5)
    .sort((left, right) => left.startRatio - right.startRatio)

  return sorted.reduce<SharedSegmentSpan[]>((merged, span) => {
    const previous = merged.at(-1)
    if (!previous || !rangesOverlapOrTouch(previous.startRatio, previous.endRatio, span.startRatio, span.endRatio)) {
      merged.push({ ...span })
      return merged
    }

    previous.endRatio = Math.max(previous.endRatio, span.endRatio)
    previous.segmentIds = [...new Set([...previous.segmentIds, ...span.segmentIds])]
    previous.roomIds = [...new Set([...previous.roomIds, ...span.roomIds])]
    return merged
  }, [])
}

function rangesOverlapOrTouch(
  leftStart: number,
  leftEnd: number,
  rightStart: number,
  rightEnd: number,
) {
  return leftStart <= rightEnd + 1e-5 && rightStart <= leftEnd + 1e-5
}

function interpolateWorldPoint(start: WorldPoint, end: WorldPoint, ratio: number): WorldPoint {
  return [
    start[0] + ((end[0] - start[0]) * ratio),
    start[1] + ((end[1] - start[1]) * ratio),
  ]
}

function subtractPoints(left: WorldPoint, right: WorldPoint): WorldPoint {
  return [left[0] - right[0], left[1] - right[1]]
}

function normalizePoint(point: WorldPoint): WorldPoint {
  const length = Math.hypot(point[0], point[1])
  if (length <= 1e-8) {
    return [0, 0]
  }

  return [point[0] / length, point[1] / length]
}

function clampRatio(value: number) {
  return Math.min(1, Math.max(0, value))
}

function resolveExteriorOverlapSpans(
  queryCache: SplineWallQueryCache,
  layerId: string,
  roomId: string | null,
  segmentId: string,
  startRatio: number,
  endRatio: number,
  exteriorSide: SplineWallSegmentSide,
): ExteriorOverlapSpan[] {
  if (endRatio - startRatio <= 1e-5) {
    return []
  }
  if (!roomId) {
    return [{
      startRatio,
      endRatio,
      oppositeRoomId: null,
    }]
  }

  const queryData = getSplineWallSegmentQueryData(queryCache, segmentId)
  const spanLength = Math.max(endRatio - startRatio, 0)
  const spanWorldLength = queryData
    ? queryData.totalLength * spanLength
    : GRID_SIZE * spanLength
  const intervalCount = Math.max(1, Math.ceil(spanWorldLength / (GRID_SIZE * 0.35)))
  const intervalBoundaries = Array.from({ length: intervalCount + 1 }, (_, index) =>
    startRatio + (spanLength * (index / intervalCount)))
  const classifications = intervalBoundaries
    .slice(0, -1)
    .map((boundaryStart, index) =>
      findOverlappingExteriorRoomIdAtRatio(
        queryCache,
        layerId,
        roomId,
        segmentId,
        (boundaryStart + intervalBoundaries[index + 1]!) / 2,
        exteriorSide,
      ))

  if (classifications.length === 0) {
    return [{
      startRatio,
      endRatio,
      oppositeRoomId: null,
    }]
  }

  const spans: ExteriorOverlapSpan[] = []
  let currentRoomId = classifications[0] ?? null
  let currentStartRatio = intervalBoundaries[0]!
  for (let index = 1; index < classifications.length; index += 1) {
    const nextRoomId = classifications[index] ?? null
    if (nextRoomId === currentRoomId) {
      continue
    }

    spans.push({
      startRatio: currentStartRatio,
      endRatio: intervalBoundaries[index]!,
      oppositeRoomId: currentRoomId,
    })
    currentStartRatio = intervalBoundaries[index]!
    currentRoomId = nextRoomId
  }

  spans.push({
    startRatio: currentStartRatio,
    endRatio: endRatio,
    oppositeRoomId: currentRoomId,
  })

  return mergeEquivalentExteriorOverlapSpans(spans)
}

function findOverlappingExteriorRoomIdAtRatio(
  queryCache: SplineWallQueryCache,
  layerId: string,
  roomId: string | null,
  segmentId: string,
  ratio: number,
  exteriorSide: SplineWallSegmentSide,
): string | null {
  if (!roomId) {
    return null
  }

  const sample = sampleSplineWallSegment(queryCache, segmentId, ratio)
  if (!sample) {
    return null
  }

  const offsetDistance = GRID_SIZE * 0.05
  const sideNormal = getSectionSideNormal(exteriorSide, sample.normal)
  const probePoint: [number, number] = [
    sample.position[0] + sideNormal[0] * offsetDistance,
    sample.position[1] + sideNormal[1] * offsetDistance,
  ]

  for (const candidateRoom of Object.values(queryCache.rooms)) {
    if (candidateRoom.roomId === roomId || candidateRoom.layerId !== layerId) {
      continue
    }
    if (isPointInsideSplineRoom(queryCache, candidateRoom.roomId, probePoint)) {
      return candidateRoom.roomId
    }
  }

  return null
}

function mergeEquivalentExteriorOverlapSpans(
  spans: readonly ExteriorOverlapSpan[],
) {
  return spans.reduce<ExteriorOverlapSpan[]>((merged, span) => {
    if (span.endRatio - span.startRatio <= 1e-5) {
      return merged
    }

    const previous = merged.at(-1)
    if (
      previous
      && previous.oppositeRoomId === span.oppositeRoomId
      && Math.abs(previous.endRatio - span.startRatio) <= 1e-5
    ) {
      previous.endRatio = span.endRatio
      return merged
    }

    merged.push({ ...span })
    return merged
  }, [])
}

function getBoundarySectionPoint(
  queryCache: SplineWallQueryCache,
  segmentId: string,
  ratio: number,
  fallbackStart: WorldPoint,
  fallbackEnd: WorldPoint,
): WorldPoint {
  const sampled = sampleSplineWallSegment(queryCache, segmentId, ratio)
  if (sampled) {
    return [sampled.position[0] / GRID_SIZE, sampled.position[1] / GRID_SIZE]
  }

  const queryData = getSplineWallSegmentQueryData(queryCache, segmentId)
  if (queryData) {
    return [
      ((queryData.start[0] + ((queryData.end[0] - queryData.start[0]) * ratio)) / GRID_SIZE),
      ((queryData.start[1] + ((queryData.end[1] - queryData.start[1]) * ratio)) / GRID_SIZE),
    ]
  }

  return interpolateWorldPoint(fallbackStart, fallbackEnd, ratio)
}

function getSectionSideNormal(
  side: SplineWallSegmentSide,
  normal: WorldPoint,
): WorldPoint {
  return side === 'right' ? [-normal[0], -normal[1]] : normal
}

function getPathWinding(points: readonly WorldPoint[], closed: boolean): PathWinding {
  if (!closed || points.length < 3) {
    return 'counterclockwise'
  }

  let signedArea = 0
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!
    const next = points[(index + 1) % points.length]!
    signedArea += (current[0] * next[1]) - (next[0] * current[1])
  }

  return signedArea >= 0 ? 'counterclockwise' : 'clockwise'
}

function toSegmentGeometryKey(start: WorldPoint, end: WorldPoint) {
  const encoded = [encodePoint(start), encodePoint(end)].sort()
  return `${encoded[0]}->${encoded[1]}`
}

function toSampledSegmentGeometryKey(layerId: string, start: WorldPoint, end: WorldPoint) {
  const encoded = [encodeSampledPoint(start), encodeSampledPoint(end)].sort()
  return `${layerId}:${encoded[0]}->${encoded[1]}`
}

function encodePoint(point: WorldPoint) {
  return `${point[0].toFixed(6)},${point[1].toFixed(6)}`
}

function encodeSampledPoint(point: WorldPoint) {
  return `${point[0].toFixed(3)},${point[1].toFixed(3)}`
}

function crossProduct(left: WorldPoint, right: WorldPoint) {
  return (left[0] * right[1]) - (left[1] * right[0])
}

function magnitudeSquared(point: WorldPoint) {
  return (point[0] * point[0]) + (point[1] * point[1])
}

function getTurnAngleRadians(
  previous: WorldPoint,
  current: WorldPoint,
  next: WorldPoint,
) {
  const incoming: WorldPoint = [
    current[0] - previous[0],
    current[1] - previous[1],
  ]
  const outgoing: WorldPoint = [
    next[0] - current[0],
    next[1] - current[1],
  ]
  const incomingLength = Math.hypot(incoming[0], incoming[1])
  const outgoingLength = Math.hypot(outgoing[0], outgoing[1])
  if (incomingLength <= 1e-8 || outgoingLength <= 1e-8) {
    return 0
  }

  const cross = Math.abs(crossProduct(incoming, outgoing)) / (incomingLength * outgoingLength)
  const dot = ((incoming[0] * outgoing[0]) + (incoming[1] * outgoing[1])) / (incomingLength * outgoingLength)
  return Math.atan2(Math.min(Math.max(cross, 0), 1), Math.min(Math.max(dot, -1), 1))
}
