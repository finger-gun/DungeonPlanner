import { useFrame, useThree } from '@react-three/fiber'
import { useDungeonStore } from '../../store/useDungeonStore'
import { transition, overlayDomRef } from './floorTransition'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

const CAMERA_SPRING_K = 6   // stiffness for the camera Y spring

/**
 * Drives the floor-switch transition purely inside useFrame — no React state,
 * no re-renders.  Must be mounted once inside the Canvas (GlobalContent).
 *
 * Phase 'out': overlay fades 0→1, camera drifts toward +BUMP (going up) or -BUMP
 *              (going down).  At peak the real switchFloor is called.
 * Phase 'in':  overlay fades 1→0, camera springs back to natural position.
 *              FloorContent has already remounted with a small startY offset.
 */
export function FloorTransitionController() {
  const { camera, invalidate } = useThree()

  useFrame((state, delta) => {
    const t = transition
    if (t.phase === 'idle') return

    // ── Advance overlay progress ──────────────────────────────────────────────
    if (t.phase === 'out') {
      t.progress = Math.min(1, t.progress + delta * t.fadeOutRate)

      if (t.progress >= 1) {
        // Midpoint: perform the floor switch while screen is fully black.
        useDungeonStore.getState().switchFloor(t.pendingId)
        t.wantedCameraOffset = 0  // now spring camera back
        t.phase = 'in'
      }
    } else {
      t.progress = Math.max(0, t.progress - delta * t.fadeInRate)
      if (t.progress <= 0) {
        t.phase = 'idle'
      }
    }

    // ── Animate camera Y (spring toward wantedCameraOffset) ──────────────────
    const controls = state.controls as OrbitControlsImpl | null
    const prev = t.actualCameraOffset
    const diff = t.wantedCameraOffset - t.actualCameraOffset
    t.actualCameraOffset += diff * (1 - Math.exp(-CAMERA_SPRING_K * delta))

    const delta_y = t.actualCameraOffset - prev
    if (Math.abs(delta_y) > 1e-5 && controls?.target) {
      camera.position.y  += delta_y
      controls.target.y  += delta_y
      controls.update()
    }

    // Snap to zero at end of in-phase to avoid float drift
    if (t.phase === 'idle' && Math.abs(t.actualCameraOffset) > 1e-5 && controls?.target) {
      const snap = -t.actualCameraOffset
      camera.position.y += snap
      controls.target.y  += snap
      controls.update()
      t.actualCameraOffset = 0
    }

    // ── Push opacity to DOM overlay (zero React overhead) ────────────────────
    if (overlayDomRef.current) {
      overlayDomRef.current.style.opacity = String(t.progress)
    }

    invalidate()
  })

  return null
}
