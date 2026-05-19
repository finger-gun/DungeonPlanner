import { getContentPackAssetById } from '../content-packs/registry'
import type { ContentPackOpeningContext, ContentPackOpeningSpanSample } from '../content-packs/types'
import { GRID_SIZE, cellToWorldPosition, getCellKey, snapWorldPointToGrid, type GridCell } from '../hooks/useSnapToGrid'
import { getOpeningSegments } from './openingSegments'
import {
  findNearestSplineWallSegment,
  getSplineWallSegmentQueryData,
  sampleSplineWallSegment,
  type SplineWallNearestHit,
  type SplineWallQueryCache,
} from './splineWallQueries'
import type { SplineWallGraph, SplineWallSegment } from './splineWallGraph'
import { isWallBoundary, wallKeyToWorldPosition } from './wallSegments'
import type { OpeningRecord, PaintedCellRecord } from './useDungeonStore'

const OPENING_PLACEMENT_EPSILON = 1e-5
const OPENING_RENDER_SAMPLE_STEP = 0.125

type OpeningSpanPlacement = {
  segmentId: string
  startRatio: number
  endRatio: number
}

type OpeningSpanWorldSample = {
  position: readonly [number, number]
  tangent: readonly [number, number]
  normal: readonly [number, number]
}

export type SplineWallOpeningPlacement = {
  segmentId: string
  segmentStartRatio: number
  segmentEndRatio: number
  wallKey: string
  width: 1 | 2 | 3
  spanWorldWidth: number
  position: [number, number, number]
  rotation: [number, number, number]
  valid: boolean
}

export type OpeningWorldTransform = {
  position: [number, number, number]
  rotation: [number, number, number]
  segmentIds: string[]
  wallKeys: string[]
}

export function getOpeningRequestedWidth(assetId: string | null): 1 | 2 | 3 {
  const asset = assetId ? getContentPackAssetById(assetId) : null
  return asset?.metadata?.openingWidth === 2 ? 2 : asset?.metadata?.openingWidth === 3 ? 3 : 1
}

export function getOpeningWorldSpan(assetId: string | null, width: 1 | 2 | 3) {
  const asset = assetId ? getContentPackAssetById(assetId) : null
  const authoredSpan = asset?.metadata?.openingCutoutWidth
  if (typeof authoredSpan === 'number' && Number.isFinite(authoredSpan) && authoredSpan > OPENING_PLACEMENT_EPSILON) {
    return authoredSpan
  }
  return width * GRID_SIZE
}

export function getOpeningVerticalCutoutSpec(opening: OpeningRecord) {
  const asset = opening.assetId ? getContentPackAssetById(opening.assetId) : null
  return {
    bottomHeight: 0,
    topHeight: asset?.metadata?.openingCutoutHeight ?? null,
  }
}

export function getOpeningSpanPlacements(
  graph: SplineWallGraph,
  opening: Pick<OpeningRecord, 'assetId' | 'wallKey' | 'width' | 'segmentId' | 'segmentStartRatio' | 'segmentEndRatio'>,
): OpeningSpanPlacement[] {
  if (
    typeof opening.segmentId === 'string'
    && typeof opening.segmentStartRatio === 'number'
    && typeof opening.segmentEndRatio === 'number'
  ) {
    return [{
      segmentId: opening.segmentId,
      startRatio: clampRatio(Math.min(opening.segmentStartRatio, opening.segmentEndRatio)),
      endRatio: clampRatio(Math.max(opening.segmentStartRatio, opening.segmentEndRatio)),
    }]
  }

  const { startRatio, endRatio } = getLegacyOpeningSpanSpec(opening.assetId, opening.width)
  return getOpeningSegments(opening.wallKey, opening.width)
    .flatMap((wallKey) => {
      const directPlacements = Object.values(graph.segments)
        .filter((segment) => segment.wallKey === wallKey)
        .map((segment) => ({
          segmentId: segment.id,
          startRatio,
          endRatio,
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
          startRatio,
          endRatio,
        ))
    })
}

export function buildSplineWallOpeningPlacement(
  point: { x: number; z: number },
  graph: SplineWallGraph,
  queryCache: SplineWallQueryCache,
  paintedCells: Record<string, PaintedCellRecord>,
  assetId: string | null,
): SplineWallOpeningPlacement | null {
  const width = getOpeningRequestedWidth(assetId)
  const hit = findNearestSplineWallSegment(queryCache, [point.x, point.z])
  if (!hit) {
    return null
  }

  const segment = graph.segments[hit.segmentId]
  if (!segment) {
    return null
  }

  const segmentLength = Math.hypot(segmentLengthDelta(graph, segment)[0], segmentLengthDelta(graph, segment)[1])
  if (segmentLength <= OPENING_PLACEMENT_EPSILON) {
    return null
  }

  const span = getOpeningWorldSpan(assetId, width)
  const halfRatio = span / (segmentLength * 2)
  const startRatio = hit.ratio - halfRatio
  const endRatio = hit.ratio + halfRatio
  const valid = startRatio >= -OPENING_PLACEMENT_EPSILON && endRatio <= 1 + OPENING_PLACEMENT_EPSILON
  const segmentStartRatio = clampRatio(startRatio)
  const segmentEndRatio = clampRatio(endRatio)
  const centerRatio = (segmentStartRatio + segmentEndRatio) / 2
  const centerSample = sampleSplineWallSegment(queryCache, hit.segmentId, centerRatio)
  if (!centerSample) {
    return null
  }

  const representativeWallKey = segment.wallKey
    ?? getRepresentativeOpeningWallKey(paintedCells, centerSample.position, centerSample.normal, hit.roomId)
    ?? buildFallbackWallKey(centerSample.position, centerSample.normal)

  return {
    segmentId: hit.segmentId,
    segmentStartRatio,
    segmentEndRatio,
    wallKey: representativeWallKey,
    width,
    spanWorldWidth: span,
    position: [centerSample.position[0], 0, centerSample.position[1]],
    rotation: [0, getOpeningRotationY(centerSample.normal), 0],
    valid,
  }
}

export function getOpeningWorldTransform(
  graph: SplineWallGraph,
  queryCache: SplineWallQueryCache,
  opening: OpeningRecord,
): OpeningWorldTransform | null {
  const placements = getOpeningSpanPlacements(graph, opening)
  if (placements.length === 0) {
    const fallbackTransform = wallKeyToWorldPosition(opening.wallKey)
    if (!fallbackTransform) {
      return null
    }

    return {
      position: fallbackTransform.position,
      rotation: opening.flipped
        ? [fallbackTransform.rotation[0], fallbackTransform.rotation[1] + Math.PI, fallbackTransform.rotation[2]]
        : fallbackTransform.rotation,
      segmentIds: [],
      wallKeys: getOpeningSegments(opening.wallKey, opening.width),
    }
  }

  const samples = placements
    .map((placement) => sampleSplineWallSegment(queryCache, placement.segmentId, (placement.startRatio + placement.endRatio) / 2))
    .filter((sample): sample is NonNullable<typeof sample> => Boolean(sample))
  if (samples.length === 0) {
    return null
  }

  const averaged = samples.reduce<[number, number]>(
    (accumulator, sample) => [accumulator[0] + sample.position[0], accumulator[1] + sample.position[1]],
    [0, 0],
  )
  const first = samples[0]!
  const rotationY = getOpeningRotationY(first.normal) + (opening.flipped ? Math.PI : 0)

  return {
    position: [averaged[0] / samples.length, 0, averaged[1] / samples.length],
    rotation: [0, rotationY, 0],
    segmentIds: [...new Set(placements.map((placement) => placement.segmentId))],
    wallKeys: opening.wallKey ? getOpeningSegments(opening.wallKey, opening.width) : [],
  }
}

export function getOpeningRenderContext(
  graph: SplineWallGraph,
  queryCache: SplineWallQueryCache,
  opening: OpeningRecord,
): ContentPackOpeningContext | null {
  const openingTransform = getOpeningWorldTransform(graph, queryCache, opening)
  if (!openingTransform) {
    return null
  }

  const placements = getOpeningSpanPlacements(graph, opening)
  if (placements.length === 0) {
    return null
  }

  const worldSamples = buildOpeningRenderWorldSamples(queryCache, placements)
  if (worldSamples.length < 2) {
    return null
  }

  let distance = 0
  const spanSamples: ContentPackOpeningSpanSample[] = []
  worldSamples.forEach((sample, index) => {
    const localSample = toOpeningLocalSpanSample(sample, openingTransform)
    if (index > 0) {
      distance += distanceBetweenOpeningSpanSamples(spanSamples[index - 1]!, localSample)
    }

    spanSamples.push({
      ...localSample,
      distance,
    })
  })

  return {
    clearSpan: getOpeningWorldSpan(opening.assetId, opening.width),
    spanSamples,
  }
}

export function findOpeningAtSplineHit(
  graph: SplineWallGraph,
  wallOpenings: Record<string, OpeningRecord>,
  hit: Pick<SplineWallNearestHit, 'segmentId' | 'ratio'> | null,
): OpeningRecord | null {
  if (!hit) {
    return null
  }

  return (
    Object.values(wallOpenings).find((opening) =>
      getOpeningSpanPlacements(graph, opening).some((placement) => (
        placement.segmentId === hit.segmentId
        && hit.ratio >= placement.startRatio - OPENING_PLACEMENT_EPSILON
        && hit.ratio <= placement.endRatio + OPENING_PLACEMENT_EPSILON
      )),
    )
    ?? null
  )
}

function buildOpeningRenderWorldSamples(
  queryCache: SplineWallQueryCache,
  placements: readonly OpeningSpanPlacement[],
) {
  const samples: OpeningSpanWorldSample[] = []

  placements.forEach((placement, placementIndex) => {
    const segmentQuery = getSplineWallSegmentQueryData(queryCache, placement.segmentId)
    const placementLength = Math.max(
      (segmentQuery?.totalLength ?? GRID_SIZE) * Math.max(placement.endRatio - placement.startRatio, OPENING_PLACEMENT_EPSILON),
      OPENING_RENDER_SAMPLE_STEP,
    )
    const stepCount = Math.max(1, Math.ceil(placementLength / OPENING_RENDER_SAMPLE_STEP))

    for (let step = 0; step <= stepCount; step += 1) {
      if (placementIndex > 0 && step === 0) {
        continue
      }

      const ratio = placement.startRatio + ((placement.endRatio - placement.startRatio) * (step / stepCount))
      const sample = sampleSplineWallSegment(queryCache, placement.segmentId, ratio)
      if (!sample) {
        continue
      }

      appendUniqueOpeningRenderWorldSample(samples, {
        position: sample.position,
        tangent: sample.tangent,
        normal: sample.normal,
      })
    }
  })

  return samples
}

function appendUniqueOpeningRenderWorldSample(
  target: OpeningSpanWorldSample[],
  sample: OpeningSpanWorldSample,
) {
  const previous = target.at(-1)
  if (
    previous
    && Math.hypot(
      previous.position[0] - sample.position[0],
      previous.position[1] - sample.position[1],
    ) <= OPENING_PLACEMENT_EPSILON
  ) {
    return
  }

  target.push(sample)
}

function toOpeningLocalSpanSample(
  sample: OpeningSpanWorldSample,
  openingTransform: OpeningWorldTransform,
): ContentPackOpeningSpanSample {
  const localPosition = worldPointToOpeningLocal(sample.position, openingTransform)
  const localTangent = rotateOpeningVector(sample.tangent, -openingTransform.rotation[1])
  const localNormal = rotateOpeningVector(sample.normal, -openingTransform.rotation[1])

  return {
    position: [localPosition[0], 0, localPosition[1]],
    tangent: [localTangent[0], 0, localTangent[1]],
    normal: [localNormal[0], 0, localNormal[1]],
    distance: 0,
  }
}

function worldPointToOpeningLocal(
  point: readonly [number, number],
  openingTransform: OpeningWorldTransform,
): [number, number] {
  const offsetX = point[0] - openingTransform.position[0]
  const offsetZ = point[1] - openingTransform.position[2]
  return rotateOpeningVector([offsetX, offsetZ], -openingTransform.rotation[1])
}

function rotateOpeningVector(
  vector: readonly [number, number],
  rotationY: number,
): [number, number] {
  const cos = Math.cos(rotationY)
  const sin = Math.sin(rotationY)
  return [
    (vector[0] * cos) + (vector[1] * sin),
    (-vector[0] * sin) + (vector[1] * cos),
  ]
}

function distanceBetweenOpeningSpanSamples(
  left: ContentPackOpeningSpanSample,
  right: ContentPackOpeningSpanSample,
) {
  return Math.hypot(
    left.position[0] - right.position[0],
    left.position[2] - right.position[2],
  )
}

export function doOpeningsOverlap(
  graph: SplineWallGraph,
  left: Pick<OpeningRecord, 'assetId' | 'wallKey' | 'width' | 'segmentId' | 'segmentStartRatio' | 'segmentEndRatio'>,
  right: Pick<OpeningRecord, 'assetId' | 'wallKey' | 'width' | 'segmentId' | 'segmentStartRatio' | 'segmentEndRatio'>,
) {
  const leftPlacements = getOpeningSpanPlacements(graph, left)
  const rightPlacements = getOpeningSpanPlacements(graph, right)
  if (leftPlacements.length === 0 || rightPlacements.length === 0) {
    const leftWallKeys = new Set(getOpeningSegments(left.wallKey, left.width))
    return getOpeningSegments(right.wallKey, right.width).some((wallKey) => leftWallKeys.has(wallKey))
  }

  return leftPlacements.some((leftPlacement) =>
    rightPlacements.some((rightPlacement) => (
      leftPlacement.segmentId === rightPlacement.segmentId
      && leftPlacement.startRatio <= rightPlacement.endRatio + OPENING_PLACEMENT_EPSILON
      && rightPlacement.startRatio <= leftPlacement.endRatio + OPENING_PLACEMENT_EPSILON
    )),
  )
}

export function getRepresentativeOpeningWallKey(
  paintedCells: Record<string, PaintedCellRecord>,
  point: readonly [number, number],
  normal: readonly [number, number],
  roomId: string | null,
): string | null {
  const targetNormal = normalize2(normal)
  let bestMatchWallKey: string | null = null
  let bestMatchScore = Number.POSITIVE_INFINITY

  Object.values(paintedCells).forEach((record) => {
    if (roomId && record.roomId !== roomId) {
      return
    }

    const [cellX, cellZ] = record.cell
    const cellCenter = cellToWorldPosition(record.cell)
    const candidates: Array<{ wallKey: string, normal: [number, number], position: [number, number] }> = [
      {
        wallKey: `${cellX}:${cellZ}:north`,
        normal: [0, -1],
        position: [cellCenter[0], (cellZ + 1) * GRID_SIZE],
      },
      {
        wallKey: `${cellX}:${cellZ}:south`,
        normal: [0, 1],
        position: [cellCenter[0], cellZ * GRID_SIZE],
      },
      {
        wallKey: `${cellX}:${cellZ}:east`,
        normal: [-1, 0],
        position: [(cellX + 1) * GRID_SIZE, cellCenter[2]],
      },
      {
        wallKey: `${cellX}:${cellZ}:west`,
        normal: [1, 0],
        position: [cellX * GRID_SIZE, cellCenter[2]],
      },
    ]

    candidates.forEach((candidate) => {
      const direction = wallKeyToDirection(candidate.wallKey)
      const neighbor = direction
        ? ([cellX + direction[0], cellZ + direction[1]] as GridCell)
        : null
      if (!neighbor || !isWallBoundary(record.cell, neighbor, paintedCells)) {
        return
      }

      const alignment = dot2(targetNormal, normalize2(candidate.normal))
      const distance = Math.hypot(point[0] - candidate.position[0], point[1] - candidate.position[1])
      const score = distance + (1 - Math.max(alignment, -1)) * GRID_SIZE
      if (score < bestMatchScore) {
        bestMatchScore = score
        bestMatchWallKey = candidate.wallKey
      }
    })
  })

  return bestMatchWallKey
}

function getLegacyOpeningSpanSpec(assetId: string | null, width: 1 | 2 | 3) {
  if (assetId === null || width !== 1) {
    return { startRatio: 0, endRatio: 1 }
  }

  const asset = getContentPackAssetById(assetId)
  const clearWidth = asset?.metadata?.openingCutoutWidth
  if (clearWidth === undefined) {
    return { startRatio: 0, endRatio: 1 }
  }

  const clampedWidth = Math.min(Math.max(clearWidth, OPENING_PLACEMENT_EPSILON), GRID_SIZE)
  if (clampedWidth >= GRID_SIZE - OPENING_PLACEMENT_EPSILON) {
    return { startRatio: 0, endRatio: 1 }
  }

  const insetRatio = (GRID_SIZE - clampedWidth) / (GRID_SIZE * 2)
  return {
    startRatio: insetRatio,
    endRatio: 1 - insetRatio,
  }
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
  const segmentIsHorizontal = Math.abs(segmentDeltaZ) <= OPENING_PLACEMENT_EPSILON
  const segmentIsVertical = Math.abs(segmentDeltaX) <= OPENING_PLACEMENT_EPSILON
  const boundaryIsHorizontal = Math.abs(boundaryDeltaZ) <= OPENING_PLACEMENT_EPSILON
  const boundaryIsVertical = Math.abs(boundaryDeltaX) <= OPENING_PLACEMENT_EPSILON

  if (
    (!segmentIsHorizontal && !segmentIsVertical)
    || segmentIsHorizontal !== boundaryIsHorizontal
    || segmentIsVertical !== boundaryIsVertical
  ) {
    return []
  }

  if (segmentIsHorizontal && Math.abs(start[1] - boundary.start[1]) > OPENING_PLACEMENT_EPSILON) {
    return []
  }
  if (segmentIsVertical && Math.abs(start[0] - boundary.start[0]) > OPENING_PLACEMENT_EPSILON) {
    return []
  }

  const boundaryStartRatio = projectPointOntoSegmentRatio(boundary.start, start, end)
  const boundaryEndRatio = projectPointOntoSegmentRatio(boundary.end, start, end)
  const overlapStartRatio = Math.max(0, Math.min(boundaryStartRatio, boundaryEndRatio))
  const overlapEndRatio = Math.min(1, Math.max(boundaryStartRatio, boundaryEndRatio))
  if (overlapEndRatio - overlapStartRatio <= OPENING_PLACEMENT_EPSILON) {
    return []
  }

  const segmentOverlapStart = interpolatePoint(start, end, overlapStartRatio)
  const segmentOverlapEnd = interpolatePoint(start, end, overlapEndRatio)
  const overlapBoundaryStart = projectPointOntoSegmentRatio(segmentOverlapStart, boundary.start, boundary.end)
  const overlapBoundaryEnd = projectPointOntoSegmentRatio(segmentOverlapEnd, boundary.start, boundary.end)
  const cutoutBoundaryStart = Math.max(openingStartRatio, Math.min(overlapBoundaryStart, overlapBoundaryEnd))
  const cutoutBoundaryEnd = Math.min(openingEndRatio, Math.max(overlapBoundaryStart, overlapBoundaryEnd))
  if (cutoutBoundaryEnd - cutoutBoundaryStart <= OPENING_PLACEMENT_EPSILON) {
    return []
  }

  const cutoutStart = interpolatePoint(boundary.start, boundary.end, cutoutBoundaryStart)
  const cutoutEnd = interpolatePoint(boundary.start, boundary.end, cutoutBoundaryEnd)
  const cutoutStartRatio = projectPointOntoSegmentRatio(cutoutStart, start, end)
  const cutoutEndRatio = projectPointOntoSegmentRatio(cutoutEnd, start, end)

  return [{
    segmentId: segment.id,
    startRatio: clampRatio(Math.min(cutoutStartRatio, cutoutEndRatio)),
    endRatio: clampRatio(Math.max(cutoutStartRatio, cutoutEndRatio)),
  }]
}

function getOpeningRotationY(normal: readonly [number, number]) {
  return Math.atan2(normal[0], normal[1])
}

function projectPointOntoSegmentRatio(point: [number, number], start: [number, number], end: [number, number]) {
  const deltaX = end[0] - start[0]
  const deltaZ = end[1] - start[1]
  const lengthSquared = deltaX * deltaX + deltaZ * deltaZ
  if (lengthSquared <= OPENING_PLACEMENT_EPSILON) {
    return 0
  }
  return (((point[0] - start[0]) * deltaX) + ((point[1] - start[1]) * deltaZ)) / lengthSquared
}

function interpolatePoint(start: [number, number], end: [number, number], ratio: number): [number, number] {
  return [
    start[0] + ((end[0] - start[0]) * ratio),
    start[1] + ((end[1] - start[1]) * ratio),
  ]
}

function segmentLengthDelta(graph: SplineWallGraph, segment: SplineWallSegment) {
  const start = graph.nodes[segment.startNodeId]?.position
  const end = graph.nodes[segment.endNodeId]?.position
  if (!start || !end) {
    return [0, 0] as const
  }
  return [
    (end[0] - start[0]) * GRID_SIZE,
    (end[1] - start[1]) * GRID_SIZE,
  ] as const
}

function wallKeyToDirection(wallKey: string): [number, number] | null {
  const direction = wallKey.split(':')[2]
  switch (direction) {
    case 'north':
      return [0, 1]
    case 'south':
      return [0, -1]
    case 'east':
      return [1, 0]
    case 'west':
      return [-1, 0]
    default:
      return null
  }
}

function buildFallbackWallKey(point: readonly [number, number], normal: readonly [number, number]) {
  const snapped = snapWorldPointToGrid({ x: point[0], y: 0, z: point[1] })
  const direction = Math.abs(normal[0]) > Math.abs(normal[1])
    ? (normal[0] >= 0 ? 'west' : 'east')
    : (normal[1] >= 0 ? 'south' : 'north')
  return `${getCellKey(snapped.cell)}:${direction}`
}

function normalize2(point: readonly [number, number]) {
  const length = Math.hypot(point[0], point[1])
  if (length <= OPENING_PLACEMENT_EPSILON) {
    return [0, 0] as const
  }
  return [point[0] / length, point[1] / length] as const
}

function dot2(left: readonly [number, number], right: readonly [number, number]) {
  return left[0] * right[0] + left[1] * right[1]
}

function clampRatio(value: number) {
  return Math.min(Math.max(value, 0), 1)
}
