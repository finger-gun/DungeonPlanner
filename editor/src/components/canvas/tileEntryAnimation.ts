export const TILE_ENTRY_ANIMATION_DEPTH = 3.0
export const TILE_ENTRY_ANIMATION_DURATION_MS = 450
export const TILE_ENTRY_ANIMATION_WARMUP_MS = 0
export const MAX_TILE_ENTRY_STAGGER_MS = 320

export type TileEntryAnimationDirection = 'rise' | 'fall'

export type TileEntryAnimationState = {
  delay: number
  startedAt: number
  direction?: TileEntryAnimationDirection
}

export function getTileEntryYOffsetForAnimation(animation: TileEntryAnimationState, now: number) {
  const elapsed =
    now
    - animation.startedAt
    - TILE_ENTRY_ANIMATION_WARMUP_MS
    - animation.delay

  if (elapsed < 0) {
    return animation.direction === 'fall' ? 0 : -TILE_ENTRY_ANIMATION_DEPTH
  }

  if (elapsed >= TILE_ENTRY_ANIMATION_DURATION_MS) {
    return animation.direction === 'fall' ? -TILE_ENTRY_ANIMATION_DEPTH : 0
  }

  const t = elapsed / TILE_ENTRY_ANIMATION_DURATION_MS
  if (animation.direction === 'fall') {
    return -TILE_ENTRY_ANIMATION_DEPTH * Math.pow(t, 3)
  }

  return -TILE_ENTRY_ANIMATION_DEPTH * Math.pow(1 - t, 3)
}

export function getTileEntryAnimationPlaybackDurationMs(extraDelay = 0) {
  return TILE_ENTRY_ANIMATION_WARMUP_MS + TILE_ENTRY_ANIMATION_DURATION_MS + MAX_TILE_ENTRY_STAGGER_MS + extraDelay
}
