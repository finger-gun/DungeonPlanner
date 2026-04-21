import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDungeonStore, type CameraPreset } from '../../store/useDungeonStore'

const LERP_FACTOR = 0.08

const ISO_DIST = 16
const PERSP_DIST = Math.sqrt(9 * 9 + 11 * 11 + 9 * 9)

// Half-height in world units visible at ortho zoom=1 (covers ~20 tiles vertically at GRID_SIZE=2)
const ORTHO_FRUSTUM = 20

type SphericalDest = {
  r: number
  phi: number
  theta: number
  fov?: number        // perspective only
  orthoZoom?: number  // orthographic only
}

// All destinations are in spherical coords (r, phi, theta) relative to origin.
// phi=0 is straight up, theta=0 is "north" (+Z).
const PRESET_TARGETS: Record<CameraPreset, SphericalDest> = {
  perspective: { r: PERSP_DIST, phi: Math.acos(11 / PERSP_DIST), theta: Math.PI / 4, fov: 42 },
  isometric:   { r: ISO_DIST,   phi: Math.acos(1 / Math.sqrt(3)), theta: Math.PI / 4, fov: 42 },
  'top-down':  { r: 24,         phi: 0.001,                       theta: 0,           orthoZoom: 1.0 },
}

const ORIGIN = new THREE.Vector3(0, 0, 0)

/** Shortest-path angle lerp — handles wrap-around cleanly */
function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a
  while (diff >  Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return a + diff * t
}

function makeOrthoCamera(aspect: number): THREE.OrthographicCamera {
  const f = ORTHO_FRUSTUM
  return new THREE.OrthographicCamera(-f * aspect, f * aspect, f, -f, 0.1, 300)
}

export function CameraPresetManager() {
  const { camera, set, size, scene, controls } = useThree()
  const cameraPreset = useDungeonStore((state) => state.cameraPreset)
  const clearCameraPreset = useDungeonStore((state) => state.clearCameraPreset)

  const destRef        = useRef<SphericalDest | null>(null)
  const perspCamRef    = useRef<THREE.PerspectiveCamera | null>(null)
  const orthoCamRef    = useRef<THREE.OrthographicCamera | null>(null)
  const isOrthoActive  = useRef(false)
  const raycasterRef   = useRef(new THREE.Raycaster())
  const targetOrbitPosRef = useRef<THREE.Vector3 | null>(null)

  // Capture the original perspective camera once on mount
  useEffect(() => {
    if (!perspCamRef.current) {
      perspCamRef.current = camera as THREE.PerspectiveCamera
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep ortho frustum in sync when the viewport resizes
  useEffect(() => {
    const cam = orthoCamRef.current
    if (!cam || !isOrthoActive.current) return
    const aspect = size.width / size.height
    const f = ORTHO_FRUSTUM
    cam.left   = -f * aspect
    cam.right  =  f * aspect
    cam.top    =  f
    cam.bottom = -f
    cam.updateProjectionMatrix()
  }, [size])

  useEffect(() => {
    if (!cameraPreset) return

    const dest = PRESET_TARGETS[cameraPreset]

    // When switching presets, find what's at screen center and make that the orbit target
    // This keeps the view centered on the same spot across preset changes
    if (controls) {
      const raycaster = raycasterRef.current
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera) // (0,0) = screen center in NDC
      const intersects = raycaster.intersectObjects(scene.children, true)
      
      // Find first mesh intersection (ignore helpers, lights, etc.)
      const hit = intersects.find(i => (i.object as THREE.Mesh).isMesh)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orbitControls = controls as any
      
      if (hit) {
        // Store the target position - we'll apply it every frame during animation
        targetOrbitPosRef.current = hit.point.clone()
        
        // Also set it immediately
        if (orbitControls?.target) {
          orbitControls.target.copy(hit.point)
        }
      } else {
        // Keep current orbit target
        if (orbitControls?.target) {
          targetOrbitPosRef.current = orbitControls.target.clone()
        }
      }
    }

    if (cameraPreset === 'top-down' && !isOrthoActive.current) {
      // Create ortho camera lazily
      const aspect = size.width / size.height
      if (!orthoCamRef.current) {
        orthoCamRef.current = makeOrthoCamera(aspect)
      } else {
        // Ensure frustum matches current viewport
        const f = ORTHO_FRUSTUM
        orthoCamRef.current.left   = -f * aspect
        orthoCamRef.current.right  =  f * aspect
        orthoCamRef.current.top    =  f
        orthoCamRef.current.bottom = -f
      }
      const ortho = orthoCamRef.current
      
      // Position ortho camera directly above the orbit target
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orbitTarget = (controls as any)?.target as THREE.Vector3 | undefined
      if (orbitTarget) {
        // Start the camera at current perspective position for smooth transition
        ortho.position.copy(camera.position)
        ortho.quaternion.copy(camera.quaternion)
      } else {
        ortho.position.copy(camera.position)
        ortho.quaternion.copy(camera.quaternion)
      }
      
      ortho.zoom = 1.0
      ortho.updateProjectionMatrix()
      set({ camera: ortho })
      isOrthoActive.current = true

    } else if (cameraPreset !== 'top-down' && isOrthoActive.current) {
      // Swap back to perspective camera, preserve position
      const persp = perspCamRef.current
      if (persp) {
        persp.position.copy(camera.position)
        persp.quaternion.copy(camera.quaternion)
        set({ camera: persp })
      }
      isOrthoActive.current = false
    }

    destRef.current = dest
    clearCameraPreset()
  }, [cameraPreset, clearCameraPreset, camera, set, size, scene, controls])

  useFrame((state) => {
    if (!destRef.current) return

    const dest         = destRef.current
    const activeCamera = state.camera
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = state.controls as any
    
    // Force orbit target to our stored target position during animation
    // This prevents orbit controls from resetting it
    if (targetOrbitPosRef.current && orbitControls?.target) {
      orbitControls.target.copy(targetOrbitPosRef.current)
    }
    
    const orbitTarget = (orbitControls?.target as THREE.Vector3) ?? ORIGIN

    // Read current spherical coords relative to current orbit target
    const offset = activeCamera.position.clone().sub(orbitTarget)
    const cur    = new THREE.Spherical().setFromVector3(offset)

    const newR     = THREE.MathUtils.lerp(cur.radius, dest.r,   LERP_FACTOR)
    const newPhi   = THREE.MathUtils.lerp(cur.phi,    dest.phi, LERP_FACTOR)
    const newTheta = lerpAngle(cur.theta, dest.theta, LERP_FACTOR)

    // Perspective: lerp FOV — Orthographic: lerp zoom
    let fovZoomArrived = true
    if (isOrthoActive.current) {
      const ortho = activeCamera as THREE.OrthographicCamera
      const targetZoom = dest.orthoZoom ?? 1.0
      const newZoom = THREE.MathUtils.lerp(ortho.zoom, targetZoom, LERP_FACTOR)
      fovZoomArrived = Math.abs(newZoom - targetZoom) < 0.01
      ortho.zoom = fovZoomArrived ? targetZoom : newZoom
      ortho.updateProjectionMatrix()
    } else {
      const persp     = activeCamera as THREE.PerspectiveCamera
      const targetFov = dest.fov ?? 42
      const newFov    = THREE.MathUtils.lerp(persp.fov, targetFov, LERP_FACTOR)
      fovZoomArrived  = Math.abs(newFov - targetFov) < 0.1
      persp.fov = fovZoomArrived ? targetFov : newFov
      persp.updateProjectionMatrix()
    }

    const arrived =
      Math.abs(newR   - dest.r)     < 0.04 &&
      Math.abs(newPhi - dest.phi)   < 0.001 &&
      Math.abs(lerpAngle(newTheta, dest.theta, 1) - dest.theta) < 0.001 &&
      fovZoomArrived

    const finalR     = arrived ? dest.r     : newR
    const finalPhi   = arrived ? dest.phi   : newPhi
    const finalTheta = arrived ? dest.theta : newTheta

    // Keep orbit target fixed - camera rotates around current target position
    activeCamera.position
      .copy(orbitTarget)
      .add(new THREE.Vector3().setFromSpherical(
        new THREE.Spherical(finalR, Math.max(0.0001, finalPhi), finalTheta),
      ))

    if (orbitControls) {
      orbitControls.update()
    }

    if (arrived) {
      destRef.current = null
      targetOrbitPosRef.current = null // Clear stored target when animation completes
    }
  })

  return null
}
