import * as THREE from 'three'
import type { CameraPreset } from '../../store/useDungeonStore'

export const ORTHO_FRUSTUM = 20

export function syncOrthoCameraFrustum(camera: THREE.OrthographicCamera, aspect: number) {
  const f = ORTHO_FRUSTUM
  camera.left = -f * aspect
  camera.right = f * aspect
  camera.top = f
  camera.bottom = -f
}

export function makeOrthoCamera(aspect: number): THREE.OrthographicCamera {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300)
  syncOrthoCameraFrustum(camera, aspect)
  return camera
}

export function usesOrthographicProjection(preset: CameraPreset) {
  return preset === 'isometric' || preset === 'top-down' || preset === 'classic'
}
