import { useSyncExternalStore } from 'react'
import { getCellKey, type GridCell } from '../hooks/useSnapToGrid'
import { releaseContinuousRender, requestContinuousRender } from '../rendering/renderActivity'
import { useDungeonStore } from './useDungeonStore'

export const BUILD_ANIMATION_DEPTH = 3.0   // world units tiles emerge from below ground
export const BUILD_ANIMATION_RISE_DURATION_MS = 450   // ms each tile takes to rise to the surface
export const BUILD_ANIMATION_DEBUG_SLOW_MULTIPLIER = 10
export const BUILD_ANIMATION_WARMUP_MS = 0
// Temporary profiling switch used during GPU-stall investigation. Keep enabled
// in normal editor behavior.
export const BUILD_ANIMATIONS_ENABLED = true
const MAX_STAGGER_MS     = 320   // max additional delay for the furthest cells
const CLEANUP_BUFFER_MS  = 200   // extra time after full animation before map cleanup
const MAX_BUILD_ANIMATION_EXTRA_DELAY_MS = 200
const BUILD_ANIMATION_RENDER_ACTIVITY = 'build-animations'
const NO_HELD_BUILD_BATCH_START = Number.MAX_SAFE_INTEGER

type AnimEntry = { delay: number; startedAt: number; active: boolean }
export type BuildAnimationState = { delay: number; startedAt: number }
export type TriggerBuildOptions = { holdUntilReleased?: boolean }
export type HeldBuildBatchState = {
  startedAt: number
  effectiveReleaseAt: number
  released: boolean
}

const registry = new Map<string, AnimEntry>()
const listeners = new Set<() => void>()
let version = 0
let activeAnimationCount = 0
let heldBuildBatch: { startedAt: number; releaseAt: number | null } | null = null

export function getBuildAnimationTimeScale() {
  return useDungeonStore.getState().slowBuildAnimationDebug
    ? BUILD_ANIMATION_DEBUG_SLOW_MULTIPLIER
    : 1
}

function notifyBuildAnimationsChanged() {
  version += 1
  listeners.forEach((listener) => listener())
}

/**
 * Schedule a build animation for a set of newly painted cells.
 *
 * @param cells      The cells that were just painted.
 * @param originCell The cascade origin — typically the stroke release corner
 *                   (opposite diagonal from where the drag started). Tiles here
 *                   appear first (delay=0); tiles near the drag start appear last.
 */
export function triggerBuild(
  cells: GridCell[],
  originCell: GridCell,
  options: TriggerBuildOptions = {},
): number | null {
  if (cells.length === 0) {
    return null
  }
  const now = performance.now()
  if (options.holdUntilReleased) {
    heldBuildBatch = {
      startedAt: now,
      releaseAt: null,
    }
  }

  // Normalise: find the max Manhattan distance from the origin so delays scale to [0, MAX_STAGGER_MS]
  const maxDist = cells.reduce((max, cell) => {
    const d = Math.abs(cell[0] - originCell[0]) + Math.abs(cell[1] - originCell[1])
    return Math.max(max, d)
  }, 1)

  cells.forEach((cell) => {
    const d     = Math.abs(cell[0] - originCell[0]) + Math.abs(cell[1] - originCell[1])
    const delay = (d / maxDist) * MAX_STAGGER_MS
    const key = getCellKey(cell)
    const previous = registry.get(key)
    if (!previous?.active) {
      activeAnimationCount += 1
    }
    registry.set(key, { delay, startedAt: now, active: true })
  })
  requestContinuousRender(BUILD_ANIMATION_RENDER_ACTIVITY)
  notifyBuildAnimationsChanged()
  return now
}

export function getBuildAnimationState(cellKey: string, extraDelay = 0): BuildAnimationState | null {
  const entry = registry.get(cellKey)
  if (!entry) {
    return null
  }

  return {
    delay: entry.delay + extraDelay,
    startedAt: entry.startedAt,
  }
}

export function getBuildYOffsetForAnimation(animation: BuildAnimationState, now: number) {
  const elapsed =
    (
      now
      - animation.startedAt
      - BUILD_ANIMATION_WARMUP_MS
      - getHeldBuildDelay(animation.startedAt, now)
    )
    / getBuildAnimationTimeScale()
    - animation.delay
  if (elapsed < 0) {
    return -BUILD_ANIMATION_DEPTH
  }

  if (elapsed >= BUILD_ANIMATION_RISE_DURATION_MS) {
    return 0
  }

  const t = elapsed / BUILD_ANIMATION_RISE_DURATION_MS
  return -BUILD_ANIMATION_DEPTH * Math.pow(1 - t, 3)
}

/**
 * Returns the Y-axis offset (always ≤ 0) that should be applied to a tile at this moment.
 * Returns 0 when there is no active animation for the given key.
 *
 * @param cellKey    The floor cell key (e.g. "3:5").
 * @param now        `performance.now()` — pass this once per useFrame call and share.
 * @param extraDelay Optional additional delay in ms (used by walls to trail their floor tile).
 */
export function getBuildYOffset(cellKey: string, now: number, extraDelay = 0): number {
  const animation = getBuildAnimationState(cellKey, extraDelay)
  if (!animation) return 0

  const offset = getBuildYOffsetForAnimation(animation, now)
  advanceBuildAnimations(now)
  return offset
}

/** True when at least one build animation is still in progress. */
export function hasActiveBuildAnimations(): boolean {
  return activeAnimationCount > 0
}

export function hasHeldBuildAnimations(): boolean {
  return heldBuildBatch?.releaseAt === null
}

export function hasOutstandingHeldBuildBatch(): boolean {
  return heldBuildBatch !== null
}

export function getHeldBuildBatchState(now: number = performance.now()): HeldBuildBatchState | null {
  if (!heldBuildBatch) {
    return null
  }

  return {
    startedAt: heldBuildBatch.startedAt,
    effectiveReleaseAt: heldBuildBatch.releaseAt ?? now,
    released: heldBuildBatch.releaseAt !== null,
  }
}

export function releaseHeldBuildAnimations(): boolean {
  if (!heldBuildBatch || heldBuildBatch.releaseAt !== null) {
    return false
  }

  heldBuildBatch.releaseAt = performance.now()
  notifyBuildAnimationsChanged()
  return true
}

export function getHeldBuildBatchUniformState(now: number = performance.now()) {
  const batch = getHeldBuildBatchState(now)
  if (!batch) {
    return {
      holdBatchStart: NO_HELD_BUILD_BATCH_START,
      holdReleaseAt: now,
    }
  }

  return {
    holdBatchStart: batch.startedAt,
    holdReleaseAt: batch.effectiveReleaseAt,
  }
}

/** True when the given cell still has an active (not yet completed) animation entry. */
export function isAnimationActive(cellKey: string): boolean {
  return registry.get(cellKey)?.active === true
}

export function advanceBuildAnimations(now: number = performance.now()) {
  if (activeAnimationCount === 0) {
    return false
  }

  let changed = false
  const timeScale = getBuildAnimationTimeScale()
  const cleanupThreshold =
    BUILD_ANIMATION_RISE_DURATION_MS + MAX_STAGGER_MS + CLEANUP_BUFFER_MS + MAX_BUILD_ANIMATION_EXTRA_DELAY_MS

  for (const entry of registry.values()) {
    if (!entry.active) {
      continue
    }

    const elapsedSinceWarmup =
      now
      - entry.startedAt
      - BUILD_ANIMATION_WARMUP_MS
      - getHeldBuildDelay(entry.startedAt, now)
    if (elapsedSinceWarmup < timeScale * (entry.delay + cleanupThreshold)) {
      continue
    }

    entry.active = false
    activeAnimationCount -= 1
    changed = true
  }

  if (!changed) {
    return false
  }

  if (activeAnimationCount === 0) {
    heldBuildBatch = null
    releaseContinuousRender(BUILD_ANIMATION_RENDER_ACTIVITY)
  }
  notifyBuildAnimationsChanged()
  return true
}

export function useBuildAnimationVersion() {
  return useSyncExternalStore(subscribeToBuildAnimations, getBuildAnimationVersion)
}

export function resetBuildAnimations() {
  if (registry.size === 0 && activeAnimationCount === 0) {
    return
  }

  registry.clear()
  activeAnimationCount = 0
  heldBuildBatch = null
  releaseContinuousRender(BUILD_ANIMATION_RENDER_ACTIVITY)
  notifyBuildAnimationsChanged()
}

function subscribeToBuildAnimations(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getBuildAnimationVersion() {
  return version
}

function getHeldBuildDelay(startedAt: number, now: number) {
  if (!heldBuildBatch || startedAt < heldBuildBatch.startedAt - 0.5) {
    return 0
  }

  const effectiveReleaseAt = heldBuildBatch.releaseAt ?? now
  return Math.max(effectiveReleaseAt - startedAt, 0)
}
