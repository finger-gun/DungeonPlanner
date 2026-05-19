export type SplineWallSegmentSide = 'left' | 'right'
const SPLINE_WALL_STYLE_SELECTION_PREFIX = 'spline-wall-style:'

export function createSplineWallSegmentSideKey(segmentId: string, side: SplineWallSegmentSide) {
  return `${segmentId}:${side}`
}

export function parseSplineWallSegmentSideKey(key: string) {
  const separatorIndex = key.lastIndexOf(':')
  if (separatorIndex <= 0) {
    return null
  }

  const segmentId = key.slice(0, separatorIndex)
  const side = key.slice(separatorIndex + 1)
  if (side !== 'left' && side !== 'right') {
    return null
  }

  return {
    segmentId,
    side,
  } satisfies { segmentId: string; side: SplineWallSegmentSide }
}

export function getStructuralSplineWallSegmentId(segmentIds: readonly string[] | string) {
  if (typeof segmentIds === 'string') {
    return segmentIds
  }

  return [...segmentIds].sort()[0] ?? ''
}

export function createSplineWallSegmentSideSelectionKey(segmentId: string, side: SplineWallSegmentSide) {
  return `${SPLINE_WALL_STYLE_SELECTION_PREFIX}${createSplineWallSegmentSideKey(segmentId, side)}`
}

export function parseSplineWallSegmentSideSelectionKey(selection: string | null | undefined) {
  if (!selection?.startsWith(SPLINE_WALL_STYLE_SELECTION_PREFIX)) {
    return null
  }

  return parseSplineWallSegmentSideKey(selection.slice(SPLINE_WALL_STYLE_SELECTION_PREFIX.length))
}
