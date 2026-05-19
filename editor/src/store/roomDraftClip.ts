import { GRID_SIZE, getCellKey, type GridCell } from '../hooks/useSnapToGrid'
import type { PaintedCellsLike, SplineWallGraph } from './splineWallGraph'
import {
  createEmptySplineWallGraph,
  hasSplineWallGraphPaths,
  upsertSplineWallGraphRoomPath,
} from './splineWallGraph'
import { createSplineWallQueryCache } from './splineWallQueries'
import {
  buildSampledSplineWallPathFromGraph,
  buildSplineWallGraphFromPaintedCells,
} from './splineWalls'
import {
  buildRoomDraftCells,
  buildRoomDraftSplineNodes,
  buildRoomDraftWorldPoints,
  getRoomDraftCenterWorldPosition,
  getRoomDraftCornerWorldPosition,
  getRoomDraftEdgeWorldPosition,
  type RoomDraftSplineNodeInput,
  type RoomDraftState,
} from './roomDraft'
import type { RoomResizeCorner, RoomResizeEdge } from './roomResize'

type Point2 = readonly [number, number]
type Rect2 = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export type PolygonGridBounds = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

type DirectedSegment = {
  start: Point2
  end: Point2
}

type SplitSegment = {
  start: Point2
  end: Point2
}

export type RoomDraftOccupancyPolygon = readonly Point2[]
export type RoomDraftClipInvalidReason = 'empty' | 'disconnected' | null
export type RoomDraftHandleVisibility = {
  corners: Record<RoomResizeCorner, boolean>
  edges: Record<RoomResizeEdge, boolean>
}

export type RoomDraftClipResult = {
  previewPoints: readonly Point2[]
  commitCells: GridCell[]
  splineNodes: RoomDraftSplineNodeInput[]
  valid: boolean
  hasOverlap: boolean
  invalidReason: RoomDraftClipInvalidReason
  handleVisibility: RoomDraftHandleVisibility
  controlPosition: [number, number, number]
}

export type RoomSplineNodeClipResult = Pick<
  RoomDraftClipResult,
  'previewPoints' | 'commitCells' | 'splineNodes' | 'valid' | 'hasOverlap' | 'invalidReason'
>

const ROOM_DRAFT_CLIP_EPSILON = 1e-5
const ROOM_DRAFT_CLIP_KEY_SCALE = 10000
const ROOM_DRAFT_CORNERS: RoomResizeCorner[] = ['nw', 'ne', 'se', 'sw']
const ROOM_DRAFT_EDGES: RoomResizeEdge[] = ['north', 'south', 'east', 'west']

export function buildRoomDraftOccupancyPolygons(
  paintedCells: PaintedCellsLike,
  splineWallGraph: SplineWallGraph | null | undefined,
): RoomDraftOccupancyPolygon[] {
  const graphPolygons = hasSplineWallGraphPaths(splineWallGraph)
    ? Object.values(createSplineWallQueryCache(splineWallGraph).rooms)
      .flatMap((room) => room.polygons.map((polygon) => sanitizePolygon(polygon)))
    : []

  const graphRoomIds = hasSplineWallGraphPaths(splineWallGraph)
    ? new Set(Object.keys(createSplineWallQueryCache(splineWallGraph).rooms))
    : new Set<string>()

  const legacyPaintedCells = Object.fromEntries(
    Object.entries(paintedCells).filter(([, record]) => !record.roomId || !graphRoomIds.has(record.roomId)),
  ) satisfies PaintedCellsLike

  if (Object.keys(legacyPaintedCells).length === 0) {
    return graphPolygons.filter((polygon) => polygon.length >= 3)
  }

  const legacyGraph = buildSplineWallGraphFromPaintedCells(legacyPaintedCells)
  const legacyPolygons = Object.values(createSplineWallQueryCache(legacyGraph).rooms)
    .flatMap((room) => room.polygons.map((polygon) => sanitizePolygon(polygon)))

  return [...graphPolygons, ...legacyPolygons].filter((polygon) => polygon.length >= 3)
}

export function clipRoomDraft(
  draft: RoomDraftState,
  occupancyPolygons: readonly RoomDraftOccupancyPolygon[],
  occupiedCellKeys?: ReadonlySet<string>,
): RoomDraftClipResult {
  const rawPreviewPoints = sanitizePolygon(buildRoomDraftWorldPoints(draft))
  const clipped = clipRoomPolygon(
    rawPreviewPoints,
    occupancyPolygons,
    occupiedCellKeys,
    buildRoomDraftCells(draft),
    buildRoomDraftSplineNodes(draft),
  )
  if (!clipped.valid) {
    return buildInvalidClipResult(
      draft,
      rawPreviewPoints,
      clipped.hasOverlap,
      clipped.invalidReason ?? 'empty',
    )
  }

  if (!clipped.hasOverlap) {
    return {
      previewPoints: clipped.previewPoints,
      commitCells: clipped.commitCells,
      splineNodes: clipped.splineNodes,
      valid: true,
      hasOverlap: false,
      invalidReason: null,
      handleVisibility: createAllVisibleHandleVisibility(),
      controlPosition: getRoomDraftCenterWorldPosition(draft),
    }
  }

  if (clipped.commitCells.length === 0) {
    return buildInvalidClipResult(draft, rawPreviewPoints, true, 'empty')
  }

  return {
    previewPoints: clipped.previewPoints,
    commitCells: clipped.commitCells,
    splineNodes: clipped.splineNodes,
    valid: true,
    hasOverlap: true,
    invalidReason: null,
    handleVisibility: buildHandleVisibility(draft, clipped.previewPoints),
    controlPosition: resolveControlPosition(clipped.commitCells, clipped.previewPoints, draft),
  }
}

export function clipRoomSplineNodes(
  splineNodes: readonly RoomDraftSplineNodeInput[],
  occupancyPolygons: readonly RoomDraftOccupancyPolygon[],
  occupiedCellKeys?: ReadonlySet<string>,
): RoomSplineNodeClipResult {
  const rawPreviewPoints = buildRoomPreviewPointsFromSplineNodes(splineNodes)
  if (rawPreviewPoints.length < 3) {
    return {
      previewPoints: rawPreviewPoints,
      commitCells: [],
      splineNodes: [],
      valid: false,
      hasOverlap: false,
      invalidReason: 'empty',
    }
  }

  const clipped = clipRoomPolygon(
    rawPreviewPoints,
    occupancyPolygons,
    occupiedCellKeys,
    buildCoveredCellsForPolygon(rawPreviewPoints, getBoundsForPolygon(rawPreviewPoints)),
    cloneRoomDraftSplineNodes(splineNodes),
  )

  return clipped
}

function filterOccupiedCommitCells(
  cells: readonly GridCell[],
  occupiedCellKeys?: ReadonlySet<string>,
): GridCell[] {
  if (!occupiedCellKeys || occupiedCellKeys.size === 0) {
    return [...cells]
  }

  return cells.filter((cell) => !occupiedCellKeys.has(getCellKey(cell)))
}

function buildInvalidClipResult(
  draft: RoomDraftState,
  rawPreviewPoints: readonly Point2[],
  hasOverlap: boolean,
  invalidReason: Exclude<RoomDraftClipInvalidReason, null>,
): RoomDraftClipResult {
  return {
    previewPoints: rawPreviewPoints,
    commitCells: [],
    splineNodes: [],
    valid: false,
    hasOverlap,
    invalidReason,
    handleVisibility: createAllVisibleHandleVisibility(),
    controlPosition: getRoomDraftCenterWorldPosition(draft),
  }
}

function buildHandleVisibility(
  draft: RoomDraftState,
  clippedPreviewPoints: readonly Point2[],
): RoomDraftHandleVisibility {
  return {
    corners: Object.fromEntries(
      ROOM_DRAFT_CORNERS.map((corner) => {
        const [x, , z] = getRoomDraftCornerWorldPosition(draft, corner)
        return [corner, isPointOnPolygonBoundary([x, z], clippedPreviewPoints)]
      }),
    ) as Record<RoomResizeCorner, boolean>,
    edges: Object.fromEntries(
      ROOM_DRAFT_EDGES.map((edge) => {
        const [x, , z] = getRoomDraftEdgeWorldPosition(draft, edge)
        return [edge, isPointOnPolygonBoundary([x, z], clippedPreviewPoints)]
      }),
    ) as Record<RoomResizeEdge, boolean>,
  }
}

function createAllVisibleHandleVisibility(): RoomDraftHandleVisibility {
  return {
    corners: Object.fromEntries(ROOM_DRAFT_CORNERS.map((corner) => [corner, true])) as Record<RoomResizeCorner, boolean>,
    edges: Object.fromEntries(ROOM_DRAFT_EDGES.map((edge) => [edge, true])) as Record<RoomResizeEdge, boolean>,
  }
}

function resolveControlPosition(
  commitCells: readonly GridCell[],
  clippedPreviewPoints: readonly Point2[],
  draft: RoomDraftState,
): [number, number, number] {
  if (commitCells.length === 0) {
    return getRoomDraftCenterWorldPosition(draft)
  }

  const averageCenter = commitCells.reduce<[number, number]>(
    (acc, cell) => [acc[0] + ((cell[0] + 0.5) * GRID_SIZE), acc[1] + ((cell[1] + 0.5) * GRID_SIZE)],
    [0, 0],
  )
  averageCenter[0] /= commitCells.length
  averageCenter[1] /= commitCells.length

  let bestCell = commitCells[0]!
  let bestDistance = Number.POSITIVE_INFINITY
  commitCells.forEach((cell) => {
    const center: Point2 = [(cell[0] + 0.5) * GRID_SIZE, (cell[1] + 0.5) * GRID_SIZE]
    if (!isPointInsidePolygon(center, clippedPreviewPoints)) {
      return
    }

    const distance = distanceBetweenPoints(center, averageCenter)
    if (distance < bestDistance) {
      bestDistance = distance
      bestCell = cell
    }
  })

  return [
    (bestCell[0] + 0.5) * GRID_SIZE,
    0,
    (bestCell[1] + 0.5) * GRID_SIZE,
  ]
}

function buildSplineNodesFromPolygon(
  polygon: readonly Point2[],
): RoomDraftSplineNodeInput[] {
  return simplifyPolygon(polygon).map((point) => ({
    position: [roundBoundaryUnit(point[0] / GRID_SIZE), roundBoundaryUnit(point[1] / GRID_SIZE)],
    cornerMode: 'square',
    cornerAmount: 0,
  }))
}

function roundBoundaryUnit(value: number) {
  return Math.round(value * ROOM_DRAFT_CLIP_KEY_SCALE) / ROOM_DRAFT_CLIP_KEY_SCALE
}

export function buildCoveredCellsForPolygon(
  polygon: readonly (readonly [number, number])[],
  bounds: PolygonGridBounds,
): GridCell[] {
  const cells: GridCell[] = []

  for (let z = bounds.minZ; z <= bounds.maxZ; z += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      if (doesPolygonCoverRect(polygon, {
        minX: x * GRID_SIZE,
        maxX: (x + 1) * GRID_SIZE,
        minY: z * GRID_SIZE,
        maxY: (z + 1) * GRID_SIZE,
      })) {
        cells.push([x, z])
      }
    }
  }

  return cells
}

function clipRoomPolygon(
  rawPreviewPoints: readonly Point2[],
  occupancyPolygons: readonly RoomDraftOccupancyPolygon[],
  occupiedCellKeys: ReadonlySet<string> | undefined,
  fallbackCommitCells: readonly GridCell[],
  fallbackSplineNodes: readonly RoomDraftSplineNodeInput[],
): RoomSplineNodeClipResult {
  if (rawPreviewPoints.length < 3) {
    return {
      previewPoints: rawPreviewPoints,
      commitCells: [],
      splineNodes: [],
      valid: false,
      hasOverlap: false,
      invalidReason: 'empty',
    }
  }

  let clippedPreviewPoints = rawPreviewPoints
  let hasOverlap = false

  for (const occupancyPolygon of occupancyPolygons) {
    const normalizedOccupancyPolygon = sanitizePolygon(occupancyPolygon)
    if (
      normalizedOccupancyPolygon.length < 3
      || !doBoundsOverlap(getBoundsForPoints(clippedPreviewPoints), getBoundsForPoints(normalizedOccupancyPolygon))
    ) {
      continue
    }

    const nextPolygons = subtractSimplePolygon(clippedPreviewPoints, normalizedOccupancyPolygon)
    if (nextPolygons.length === 1 && arePolygonsEquivalent(nextPolygons[0]!, clippedPreviewPoints)) {
      continue
    }

    hasOverlap = true
    if (nextPolygons.length === 0) {
      return {
        previewPoints: rawPreviewPoints,
        commitCells: [],
        splineNodes: [],
        valid: false,
        hasOverlap: true,
        invalidReason: 'empty',
      }
    }
    if (nextPolygons.length !== 1) {
      return {
        previewPoints: rawPreviewPoints,
        commitCells: [],
        splineNodes: [],
        valid: false,
        hasOverlap: true,
        invalidReason: 'disconnected',
      }
    }

    clippedPreviewPoints = nextPolygons[0]!
  }

  if (!hasOverlap) {
    const commitCells = filterOccupiedCommitCells([...fallbackCommitCells], occupiedCellKeys)
    return {
      previewPoints: rawPreviewPoints,
      commitCells,
      splineNodes: cloneRoomDraftSplineNodes(fallbackSplineNodes),
      valid: commitCells.length > 0,
      hasOverlap: false,
      invalidReason: commitCells.length > 0 ? null : 'empty',
    }
  }

  const commitCells = filterOccupiedCommitCells(
    buildCoveredCellsForPolygon(clippedPreviewPoints, getBoundsForPolygon(clippedPreviewPoints)),
    occupiedCellKeys,
  )
  return {
    previewPoints: clippedPreviewPoints,
    commitCells,
    splineNodes: buildSplineNodesFromPolygon(clippedPreviewPoints),
    valid: commitCells.length > 0,
    hasOverlap: true,
    invalidReason: commitCells.length > 0 ? null : 'empty',
  }
}

function buildRoomPreviewPointsFromSplineNodes(splineNodes: readonly RoomDraftSplineNodeInput[]) {
  if (splineNodes.length < 3) {
    return []
  }

  const graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
    roomId: 'preview-room',
    layerId: 'default',
    nodes: cloneRoomDraftSplineNodes(splineNodes),
    closed: true,
  })
  const path = graph.paths['preview-room:path:0']
  if (!path) {
    return []
  }

  return sanitizePolygon(buildSampledSplineWallPathFromGraph(path, graph))
}

function cloneRoomDraftSplineNodes(
  splineNodes: readonly RoomDraftSplineNodeInput[],
): RoomDraftSplineNodeInput[] {
  return splineNodes.map((node) => ({
    position: [...node.position] as [number, number],
    cornerMode: node.cornerMode,
    cornerAmount: node.cornerAmount,
  }))
}

function getBoundsForPolygon(
  polygon: readonly Point2[],
): RoomDraftState['bounds'] {
  const bounds = getBoundsForPoints(polygon)
  return {
    minX: Math.floor(bounds.minX / GRID_SIZE),
    maxX: Math.ceil(bounds.maxX / GRID_SIZE) - 1,
    minZ: Math.floor(bounds.minY / GRID_SIZE),
    maxZ: Math.ceil(bounds.maxY / GRID_SIZE) - 1,
  }
}

function subtractSimplePolygon(
  subject: readonly Point2[],
  clip: readonly Point2[],
): Point2[][] {
  const keptSegments = [
    ...splitPolygonAgainstPolygon(subject, clip)
      .filter((segment) => !isPointInsidePolygon(getSegmentMidpoint(segment), clip)),
    ...splitPolygonAgainstPolygon(clip, subject)
      .filter((segment) => isPointInsidePolygon(getSegmentMidpoint(segment), subject)),
  ]

  const directedSegments = dedupeDirectedSegments(
    keptSegments
      .map((segment) => orientSegmentForClockwiseRegion(segment, subject, clip))
      .filter((segment): segment is DirectedSegment => Boolean(segment)),
  )

  if (directedSegments.length === 0) {
    return []
  }

  return traceClosedLoops(directedSegments)
}

function splitPolygonAgainstPolygon(
  polygon: readonly Point2[],
  otherPolygon: readonly Point2[],
): SplitSegment[] {
  const segments: SplitSegment[] = []

  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index]!
    const end = polygon[(index + 1) % polygon.length]!
    const intersections = [
      { point: start, t: 0 },
      { point: end, t: 1 },
    ]

    for (let otherIndex = 0; otherIndex < otherPolygon.length; otherIndex += 1) {
      const otherStart = otherPolygon[otherIndex]!
      const otherEnd = otherPolygon[(otherIndex + 1) % otherPolygon.length]!
      const intersection = intersectSegments(start, end, otherStart, otherEnd)
      if (!intersection) {
        continue
      }
      intersections.push(intersection)
    }

    const splitPoints = intersections
      .sort((left, right) => left.t - right.t)
      .reduce<Array<{ point: Point2; t: number }>>((acc, entry) => {
        const previous = acc.at(-1)
        if (
          previous
          && (
            Math.abs(previous.t - entry.t) <= ROOM_DRAFT_CLIP_EPSILON
            || distanceBetweenPoints(previous.point, entry.point) <= ROOM_DRAFT_CLIP_EPSILON
          )
        ) {
          return acc
        }
        acc.push(entry)
        return acc
      }, [])

    for (let splitIndex = 0; splitIndex < splitPoints.length - 1; splitIndex += 1) {
      const segmentStart = splitPoints[splitIndex]!.point
      const segmentEnd = splitPoints[splitIndex + 1]!.point
      if (distanceBetweenPoints(segmentStart, segmentEnd) <= ROOM_DRAFT_CLIP_EPSILON) {
        continue
      }
      segments.push({
        start: segmentStart,
        end: segmentEnd,
      })
    }
  }

  return segments
}

function orientSegmentForClockwiseRegion(
  segment: SplitSegment,
  subject: readonly Point2[],
  clip: readonly Point2[],
): DirectedSegment | null {
  const tangent = subtractPoint(segment.end, segment.start)
  const length = distanceBetweenPoints(segment.start, segment.end)
  if (length <= ROOM_DRAFT_CLIP_EPSILON) {
    return null
  }

  const midpoint = getSegmentMidpoint(segment)
  const normal: Point2 = [tangent[1] / length, -tangent[0] / length]
  const baseOffset = Math.max(Math.min(length * 0.2, GRID_SIZE * 0.12), ROOM_DRAFT_CLIP_EPSILON * 10)
  const offsetCandidates = [
    baseOffset,
    baseOffset * 0.5,
    baseOffset * 0.25,
    ROOM_DRAFT_CLIP_EPSILON * 20,
    ROOM_DRAFT_CLIP_EPSILON * 10,
    ROOM_DRAFT_CLIP_EPSILON * 4,
  ]

  for (const offset of offsetCandidates) {
    const clockwiseSample = addPoint(midpoint, scalePoint(normal, offset))
    if (isPointInsideDifference(clockwiseSample, subject, clip)) {
      return {
        start: segment.start,
        end: segment.end,
      }
    }

    const reverseSample = addPoint(midpoint, scalePoint(normal, -offset))
    if (isPointInsideDifference(reverseSample, subject, clip)) {
      return {
        start: segment.end,
        end: segment.start,
      }
    }
  }

  return null
}

function traceClosedLoops(segments: readonly DirectedSegment[]): Point2[][] {
  const startMap = new Map<string, number[]>()
  const incomingCounts = new Map<string, number>()

  segments.forEach((segment, index) => {
    const startKey = pointToKey(segment.start)
    const endKey = pointToKey(segment.end)
    startMap.set(startKey, [...(startMap.get(startKey) ?? []), index])
    incomingCounts.set(endKey, (incomingCounts.get(endKey) ?? 0) + 1)
  })

  for (const [key, indices] of startMap.entries()) {
    if (indices.length !== 1 || (incomingCounts.get(key) ?? 0) !== 1) {
      return []
    }
  }

  const visited = new Set<number>()
  const loops: Point2[][] = []

  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
    if (visited.has(segmentIndex)) {
      continue
    }

    const loop: Point2[] = []
    const firstSegment = segments[segmentIndex]!
    let currentIndex = segmentIndex

    while (!visited.has(currentIndex)) {
      visited.add(currentIndex)
      const currentSegment = segments[currentIndex]!
      loop.push(currentSegment.start)
      const nextKey = pointToKey(currentSegment.end)
      const nextCandidates = startMap.get(nextKey) ?? []
      if (nextCandidates.length !== 1) {
        return []
      }
      currentIndex = nextCandidates[0]!
    }

    const lastEnd = segments[currentIndex]!.start
    if (distanceBetweenPoints(lastEnd, firstSegment.start) > ROOM_DRAFT_CLIP_EPSILON) {
      return []
    }

    const simplified = ensureClockwise(simplifyPolygon(loop))
    if (simplified.length < 3) {
      return []
    }
    loops.push(simplified)
  }

  return loops
}

function dedupeDirectedSegments(segments: readonly DirectedSegment[]) {
  const seen = new Set<string>()
  return segments.filter((segment) => {
    const key = `${pointToKey(segment.start)}>${pointToKey(segment.end)}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function pointToKey(point: Point2) {
  return `${Math.round(point[0] * ROOM_DRAFT_CLIP_KEY_SCALE)}:${Math.round(point[1] * ROOM_DRAFT_CLIP_KEY_SCALE)}`
}

function arePolygonsEquivalent(
  left: readonly Point2[],
  right: readonly Point2[],
): boolean {
  if (left.length !== right.length) {
    return false
  }

  const normalizedLeft = simplifyPolygon(left)
  const normalizedRight = simplifyPolygon(right)
  if (normalizedLeft.length !== normalizedRight.length) {
    return false
  }

  const size = normalizedLeft.length
  for (let offset = 0; offset < size; offset += 1) {
    let matches = true
    for (let index = 0; index < size; index += 1) {
      if (distanceBetweenPoints(normalizedLeft[index]!, normalizedRight[(index + offset) % size]!) > ROOM_DRAFT_CLIP_EPSILON) {
        matches = false
        break
      }
    }
    if (matches) {
      return true
    }
  }

  return false
}

function ensureClockwise(polygon: readonly Point2[]) {
  return computeSignedArea(polygon) <= 0 ? [...polygon] : [...polygon].reverse()
}

function computeSignedArea(polygon: readonly Point2[]) {
  let area = 0
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index]!
    const next = polygon[(index + 1) % polygon.length]!
    area += current[0] * next[1] - next[0] * current[1]
  }
  return area / 2
}

function simplifyPolygon(polygon: readonly Point2[]) {
  const deduped = polygon.reduce<Point2[]>((acc, point) => {
    const previous = acc.at(-1)
    if (previous && distanceBetweenPoints(previous, point) <= ROOM_DRAFT_CLIP_EPSILON) {
      return acc
    }
    acc.push(point)
    return acc
  }, [])

  let changed = true
  while (changed && deduped.length >= 3) {
    changed = false
    for (let index = 0; index < deduped.length; index += 1) {
      const previous = deduped[(index - 1 + deduped.length) % deduped.length]!
      const current = deduped[index]!
      const next = deduped[(index + 1) % deduped.length]!
      if (distanceBetweenPoints(previous, current) <= ROOM_DRAFT_CLIP_EPSILON) {
        deduped.splice(index, 1)
        changed = true
        break
      }
      if (Math.abs(crossPoint(subtractPoint(current, previous), subtractPoint(next, current))) <= ROOM_DRAFT_CLIP_EPSILON) {
        deduped.splice(index, 1)
        changed = true
        break
      }
    }
  }

  if (
    deduped.length > 1
    && distanceBetweenPoints(deduped[0]!, deduped.at(-1)!) <= ROOM_DRAFT_CLIP_EPSILON
  ) {
    deduped.pop()
  }

  return deduped
}

function getBoundsForPoints(points: readonly Point2[]): Rect2 {
  return points.reduce<Rect2>((bounds, point) => ({
    minX: Math.min(bounds.minX, point[0]),
    maxX: Math.max(bounds.maxX, point[0]),
    minY: Math.min(bounds.minY, point[1]),
    maxY: Math.max(bounds.maxY, point[1]),
  }), {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  })
}

function doBoundsOverlap(left: Rect2, right: Rect2) {
  return !(
    left.maxX < right.minX - ROOM_DRAFT_CLIP_EPSILON
    || left.minX > right.maxX + ROOM_DRAFT_CLIP_EPSILON
    || left.maxY < right.minY - ROOM_DRAFT_CLIP_EPSILON
    || left.minY > right.maxY + ROOM_DRAFT_CLIP_EPSILON
  )
}

function getSegmentMidpoint(segment: SplitSegment): Point2 {
  return [
    (segment.start[0] + segment.end[0]) / 2,
    (segment.start[1] + segment.end[1]) / 2,
  ]
}

function intersectSegments(
  startA: Point2,
  endA: Point2,
  startB: Point2,
  endB: Point2,
) {
  const directionA = subtractPoint(endA, startA)
  const directionB = subtractPoint(endB, startB)
  const denominator = crossPoint(directionA, directionB)
  if (Math.abs(denominator) <= ROOM_DRAFT_CLIP_EPSILON) {
    return null
  }

  const startOffset = subtractPoint(startB, startA)
  const t = crossPoint(startOffset, directionB) / denominator
  const u = crossPoint(startOffset, directionA) / denominator
  if (
    t < -ROOM_DRAFT_CLIP_EPSILON
    || t > 1 + ROOM_DRAFT_CLIP_EPSILON
    || u < -ROOM_DRAFT_CLIP_EPSILON
    || u > 1 + ROOM_DRAFT_CLIP_EPSILON
  ) {
    return null
  }

  return {
    point: addPoint(startA, scalePoint(directionA, clamp01(t))),
    t: clamp01(t),
  }
}

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1)
}

function isPointInsideDifference(
  point: Point2,
  subject: readonly Point2[],
  clip: readonly Point2[],
) {
  return isPointInsidePolygon(point, subject) && !isPointInsidePolygon(point, clip)
}

function isPointInsidePolygon(point: Point2, polygon: readonly Point2[]) {
  if (polygon.length < 3) {
    return false
  }

  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    if (isPointOnSegment(point, polygon[previousIndex]!, polygon[index]!)) {
      return false
    }
  }

  let inside = false
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index]!
    const previous = polygon[previousIndex]!
    const intersects = ((current[1] > point[1]) !== (previous[1] > point[1]))
      && (point[0] < ((previous[0] - current[0]) * (point[1] - current[1])) / ((previous[1] - current[1]) || ROOM_DRAFT_CLIP_EPSILON) + current[0])
    if (intersects) {
      inside = !inside
    }
  }

  return inside
}

function isPointOnPolygonBoundary(point: Point2, polygon: readonly Point2[]) {
  for (let index = 0; index < polygon.length; index += 1) {
    if (isPointOnSegment(point, polygon[index]!, polygon[(index + 1) % polygon.length]!)) {
      return true
    }
  }
  return false
}

function isPointOnSegment(point: Point2, start: Point2, end: Point2) {
  const segmentLength = distanceBetweenPoints(start, end)
  if (segmentLength <= ROOM_DRAFT_CLIP_EPSILON) {
    return distanceBetweenPoints(point, start) <= ROOM_DRAFT_CLIP_EPSILON
  }

  const cross = (point[0] - start[0]) * (end[1] - start[1]) - (point[1] - start[1]) * (end[0] - start[0])
  if (Math.abs(cross) > ROOM_DRAFT_CLIP_EPSILON) {
    return false
  }

  const dot = (point[0] - start[0]) * (end[0] - start[0]) + (point[1] - start[1]) * (end[1] - start[1])
  if (dot < -ROOM_DRAFT_CLIP_EPSILON) {
    return false
  }

  return dot <= segmentLength * segmentLength + ROOM_DRAFT_CLIP_EPSILON
}

function doesPolygonCoverRect(polygon: readonly Point2[], rect: Rect2) {
  if (polygon.length < 3) {
    return false
  }

  const center: Point2 = [
    (rect.minX + rect.maxX) / 2,
    (rect.minY + rect.maxY) / 2,
  ]
  if (isPointInsidePolygon(center, polygon)) {
    return true
  }

  const interiorRect = insetRect(rect, ROOM_DRAFT_CLIP_EPSILON * 10)
  const corners: Point2[] = [
    [rect.minX, rect.minY],
    [rect.maxX, rect.minY],
    [rect.maxX, rect.maxY],
    [rect.minX, rect.maxY],
  ]

  if (corners.some((corner) => isPointInsidePolygon(corner, polygon))) {
    return true
  }

  if (polygon.some((point) => isPointInsideRect(point, interiorRect))) {
    return true
  }

  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index]!
    const end = polygon[(index + 1) % polygon.length]!
    if (segmentHasInteriorInsideRect(start, end, interiorRect)) {
      return true
    }
  }

  return false
}

function insetRect(rect: Rect2, inset: number): Rect2 {
  const safeInsetX = Math.max(Math.min(inset, (rect.maxX - rect.minX) / 2 - ROOM_DRAFT_CLIP_EPSILON), 0)
  const safeInsetY = Math.max(Math.min(inset, (rect.maxY - rect.minY) / 2 - ROOM_DRAFT_CLIP_EPSILON), 0)
  return {
    minX: rect.minX + safeInsetX,
    maxX: rect.maxX - safeInsetX,
    minY: rect.minY + safeInsetY,
    maxY: rect.maxY - safeInsetY,
  }
}

function isPointInsideRect(point: Point2, rect: Rect2) {
  return (
    point[0] >= rect.minX - ROOM_DRAFT_CLIP_EPSILON
    && point[0] <= rect.maxX + ROOM_DRAFT_CLIP_EPSILON
    && point[1] >= rect.minY - ROOM_DRAFT_CLIP_EPSILON
    && point[1] <= rect.maxY + ROOM_DRAFT_CLIP_EPSILON
  )
}

function segmentHasInteriorInsideRect(start: Point2, end: Point2, rect: Rect2) {
  const deltaX = end[0] - start[0]
  const deltaY = end[1] - start[1]
  let minT = 0
  let maxT = 1

  const clip = (p: number, q: number) => {
    if (Math.abs(p) <= ROOM_DRAFT_CLIP_EPSILON) {
      return q >= -ROOM_DRAFT_CLIP_EPSILON
    }

    const ratio = q / p
    if (p < 0) {
      if (ratio > maxT) {
        return false
      }
      if (ratio > minT) {
        minT = ratio
      }
      return true
    }

    if (ratio < minT) {
      return false
    }
    if (ratio < maxT) {
      maxT = ratio
    }
    return true
  }

  if (
    !clip(-deltaX, start[0] - rect.minX)
    || !clip(deltaX, rect.maxX - start[0])
    || !clip(-deltaY, start[1] - rect.minY)
    || !clip(deltaY, rect.maxY - start[1])
  ) {
    return false
  }

  return maxT - minT > ROOM_DRAFT_CLIP_EPSILON
}

function sanitizePolygon(points: readonly Point2[]) {
  const sanitized = [...points]
  if (
    sanitized.length > 1
    && distanceBetweenPoints(sanitized[0]!, sanitized.at(-1)!) <= ROOM_DRAFT_CLIP_EPSILON
  ) {
    sanitized.pop()
  }
  return simplifyPolygon(sanitized)
}

function addPoint(left: Point2, right: Point2): Point2 {
  return [left[0] + right[0], left[1] + right[1]]
}

function subtractPoint(left: Point2, right: Point2): Point2 {
  return [left[0] - right[0], left[1] - right[1]]
}

function scalePoint(point: Point2, scale: number): Point2 {
  return [point[0] * scale, point[1] * scale]
}

function crossPoint(left: Point2, right: Point2) {
  return left[0] * right[1] - left[1] * right[0]
}

function distanceBetweenPoints(left: Point2, right: Point2) {
  return Math.hypot(left[0] - right[0], left[1] - right[1])
}
