import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDungeonStore, type CameraPreset } from '../../store/useDungeonStore'

const LERP_FACTOR = 0.08

const ISO_DIST = 16
const PERSP_DIST = Math.sqrt(9 * 9 + 11 * 11 + 9 * 9)

type SphericalDest = { r: number; phi: number; theta: number; fov: number }

// All destinations are in spherical coords (r, phi, theta) relative to origin.
// phi=0 is straight up, theta=0 is "north" (+Z).
const PRESET_TARGETS: Record<CameraPreset, SphericalDest> = {
  perspective: { r: PERSP_DIST, phi: Math.acos(11 / PERSP_DIST), theta: Math.PI / 4, fov: 42 },
  isometric:   { r: ISO_DIST,   phi: Math.acos(1 / Math.sqrt(3)), theta: Math.PI / 4, fov: 42 },
  'top-down':  { r: 24,         phi: 0.001,                       theta: 0,           fov: 80 },
}

const ORIGIN = new THREE.Vector3(0, 0, 0)

/** Shortest-path angle lerp — handles wrap-around cleanly */
function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a
  while (diff >  Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return a + diff * t
}

export function CameraPresetManager() {
  const { camera, controls } = useThree()
  const cameraPreset = useDungeonStore((state) => state.cameraPreset)
  const clearCameraPreset = useDungeonStore((state) => state.clearCameraPreset)

  const destRef = useRef<SphericalDest | null>(null)

  useEffect(() => {
    if (!cameraPreset) return
    destRef.current = PRESET_TARGETS[cameraPreset]
    clearCameraPreset()
  }, [cameraPreset, clearCameraPreset])

  useFrame(() => {
    if (!destRef.current) return

    const dest = destRef.current
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = controls as any
    const perspCamera = camera as THREE.PerspectiveCamera
    const orbitTarget = (orbitControls?.target as THREE.Vector3) ?? ORIGIN

    // Read current spherical coords
    const offset = camera.position.clone().sub(orbitTarget)
    const cur = new THREE.Spherical().setFromVector3(offset)

    // Lerp each spherical component independently — smooth arc, no cartesian snap
    const newR     = THREE.MathUtils.lerp(cur.radius, dest.r,   LERP_FACTOR)
    const newPhi   = THREE.MathUtils.lerp(cur.phi,    dest.phi, LERP_FACTOR)
    const newTheta = lerpAngle(cur.theta, dest.theta, LERP_FACTOR)
    const newFov   = THREE.MathUtils.lerp(perspCamera.fov, dest.fov, LERP_FACTOR)

    const arrived =
      Math.abs(newR   - dest.r)     < 0.04 &&
      Math.abs(newPhi - dest.phi)   < 0.001 &&
      Math.abs(lerpAngle(newTheta, dest.theta, 1) - dest.theta) < 0.001 &&
      Math.abs(newFov - dest.fov)   < 0.1

    const finalR     = arrived ? dest.r     : newR
    const finalPhi   = arrived ? dest.phi   : newPhi
    const finalTheta = arrived ? dest.theta : newTheta
    const finalFov   = arrived ? dest.fov   : newFov

    // Write back via spherical → avoids the cartesian near-zero azimuth snap
    camera.position
      .copy(orbitTarget)
      .add(new THREE.Vector3().setFromSpherical(
        new THREE.Spherical(finalR, Math.max(0.0001, finalPhi), finalTheta),
      ))

    perspCamera.fov = finalFov
    perspCamera.updateProjectionMatrix()

    if (orbitControls?.target) {
      if (arrived) {
        (orbitControls.target as THREE.Vector3).copy(ORIGIN)
      } else {
        (orbitControls.target as THREE.Vector3).lerp(ORIGIN, LERP_FACTOR)
      }
      orbitControls.update()
    }

    if (arrived) destRef.current = null
  })

  return null
}
