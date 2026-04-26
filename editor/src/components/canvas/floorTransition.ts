/**
 * Module-level floor-transition signal.
 *
 * Using plain mutable objects keeps all animation state out of React/Zustand,
 * so the FloorTransitionController can read and write it inside useFrame with
 * zero React overhead.
 */

import { useDungeonStore } from '../../store/useDungeonStore'

export const CAMERA_BUMP  = 3     // world units the camera travels on transition
const FADE_OUT_DURATION   = 0.28  // seconds to fade overlay to black
const FADE_IN_DURATION    = 0.45  // seconds to reveal new floor

export type TransitionPhase = 'idle' | 'out' | 'in'

/** Shared mutable state read/written exclusively by FloorTransitionController. */
export const transition = {
  phase:           'idle' as TransitionPhase,
  /** Overlay opacity (0 = transparent, 1 = fully opaque / black). */
  progress:        0,
  pendingId:       '',
  direction:       1 as 1 | -1,
  /** Desired camera Y offset that the spring follows. */
  wantedCameraOffset: 0,
  /** Current (actual) camera Y offset — applied incrementally. */
  actualCameraOffset: 0,
  /** Rate controls derived from durations — computed once below. */
  fadeOutRate: 1 / FADE_OUT_DURATION,
  fadeInRate:  1 / FADE_IN_DURATION,
}

/** Imperative ref to the DOM overlay element — avoids React state for zero-cost updates. */
export const overlayDomRef: { current: HTMLDivElement | null } = { current: null }

// ─── Trigger ──────────────────────────────────────────────────────────────────

/**
 * Call instead of `switchFloor` from any UI component.
 * If a transition is already running the call is a no-op.
 */
export function requestFloorTransition(targetId: string): void {
  if (transition.phase !== 'idle') return

  const store = useDungeonStore.getState()
  if (targetId === store.activeFloorId) return

  const currentLevel = store.floors[store.activeFloorId]?.level ?? 0
  const targetLevel  = store.floors[targetId]?.level ?? 0

  transition.direction           = targetLevel >= currentLevel ? 1 : -1
  transition.pendingId           = targetId
  transition.progress            = 0
  transition.wantedCameraOffset  = transition.direction * CAMERA_BUMP
  transition.actualCameraOffset  = 0
  transition.phase               = 'out'
}
