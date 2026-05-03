export const AUTOFOCUS_RAYCAST_INTERVAL_MS = 120

export type AutofocusPoint = {
  x: number
  y: number
  z: number
} | null

export type AutofocusRaycastViewState = {
  position: readonly [number, number, number]
  quaternion: readonly [number, number, number, number]
  zoom: number
  orbitTarget: AutofocusPoint
}

const EPSILON = 1e-4

export function didAutofocusViewStateChange(
  previous: AutofocusRaycastViewState | null,
  next: AutofocusRaycastViewState,
) {
  if (!previous) {
    return true
  }

  return !matchesTuple(previous.position, next.position)
    || !matchesTuple(previous.quaternion, next.quaternion)
    || Math.abs(previous.zoom - next.zoom) > EPSILON
    || !matchesPoint(previous.orbitTarget, next.orbitTarget)
}

export function shouldRefreshAutofocusRaycast({
  nowMs,
  lastSampleTimeMs,
  hasCachedRaycastTarget,
  needsResample,
  viewStateChanged,
}: {
  nowMs: number
  lastSampleTimeMs: number
  hasCachedRaycastTarget: boolean
  needsResample: boolean
  viewStateChanged: boolean
}) {
  if (needsResample || !hasCachedRaycastTarget || !Number.isFinite(lastSampleTimeMs)) {
    return true
  }

  if (!viewStateChanged) {
    return false
  }

  return nowMs - lastSampleTimeMs >= AUTOFOCUS_RAYCAST_INTERVAL_MS
}

function matchesPoint(previous: AutofocusPoint, next: AutofocusPoint) {
  if (previous === next) {
    return true
  }

  if (!previous || !next) {
    return false
  }

  return matchesTuple(
    [previous.x, previous.y, previous.z],
    [next.x, next.y, next.z],
  )
}

function matchesTuple(previous: readonly number[], next: readonly number[]) {
  return previous.length === next.length
    && previous.every((value, index) => Math.abs(value - next[index]!) <= EPSILON)
}
