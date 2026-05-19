type Point2D = readonly [number, number]

export type SplineWallStraightSegmentOwnerCandidate = {
  start: Point2D
  end: Point2D
  tangent: Point2D
}

export function findOwningStraightSegmentCandidate<T extends SplineWallStraightSegmentOwnerCandidate>(
  point: Point2D,
  candidates: readonly T[],
  epsilon: number,
): T | null {
  let owner: T | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  let bestAlignment = Number.NEGATIVE_INFINITY

  candidates.forEach((candidate) => {
    const closestPoint = closestPointOnSegment(point, candidate.start, candidate.end, epsilon)
    const distance = distanceBetweenPoints(point, closestPoint)
    if (distance > bestDistance + epsilon) {
      return
    }

    const offset = subtractPoints(point, closestPoint)
    const alignment = Math.abs(dotPoint(normalizePoint(offset, epsilon), candidate.tangent))
    if (
      distance < bestDistance - epsilon
      || alignment > bestAlignment + epsilon
    ) {
      owner = candidate
      bestDistance = distance
      bestAlignment = alignment
    }
  })

  return owner
}

function closestPointOnSegment(
  point: Point2D,
  start: Point2D,
  end: Point2D,
  epsilon: number,
): Point2D {
  return interpolatePoint(
    start,
    end,
    projectPointToSegmentRatio(point, start, end, epsilon),
  )
}

function projectPointToSegmentRatio(
  point: Point2D,
  start: Point2D,
  end: Point2D,
  epsilon: number,
) {
  const delta = subtractPoints(end, start)
  const lengthSquared = dotPoint(delta, delta)
  if (lengthSquared <= epsilon) {
    return 0
  }

  return clampRatio(dotPoint(subtractPoints(point, start), delta) / lengthSquared)
}

function interpolatePoint(start: Point2D, end: Point2D, ratio: number): Point2D {
  return [
    start[0] + ((end[0] - start[0]) * ratio),
    start[1] + ((end[1] - start[1]) * ratio),
  ]
}

function subtractPoints(left: Point2D, right: Point2D): Point2D {
  return [left[0] - right[0], left[1] - right[1]]
}

function dotPoint(left: Point2D, right: Point2D) {
  return (left[0] * right[0]) + (left[1] * right[1])
}

function normalizePoint(point: Point2D, epsilon: number): Point2D {
  const length = Math.hypot(point[0], point[1])
  if (length <= epsilon) {
    return [0, 0]
  }

  return [point[0] / length, point[1] / length]
}

function distanceBetweenPoints(left: Point2D, right: Point2D) {
  return Math.hypot(left[0] - right[0], left[1] - right[1])
}

function clampRatio(value: number) {
  return Math.min(1, Math.max(0, value))
}
