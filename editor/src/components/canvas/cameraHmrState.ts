import * as THREE from 'three'
import type { CameraPreset } from '../../store/useDungeonStore'

export const HMR_CAMERA_STATE_KEY = 'sceneCameraState'

export type HmrCameraState = {
  activeCameraMode: CameraPreset
  projection: 'perspective' | 'orthographic'
  position: readonly [number, number, number]
  target: readonly [number, number, number]
  fov?: number
  zoom?: number
}

export function captureHmrCameraState(
  camera: THREE.Camera,
  target: THREE.Vector3,
  activeCameraMode: CameraPreset,
): HmrCameraState {
  const baseState = {
    activeCameraMode,
    position: [camera.position.x, camera.position.y, camera.position.z] as const,
    target: [target.x, target.y, target.z] as const,
  }

  if (camera instanceof THREE.OrthographicCamera) {
    return {
      ...baseState,
      projection: 'orthographic',
      zoom: camera.zoom,
    }
  }

  const perspectiveCamera = camera as THREE.PerspectiveCamera
  return {
    ...baseState,
    projection: 'perspective',
    fov: perspectiveCamera.fov,
  }
}

function isFiniteTuple(value: unknown): value is readonly [number, number, number] {
  return Array.isArray(value)
    && value.length === 3
    && value.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
}

function isCameraPreset(value: unknown): value is CameraPreset {
  return value === 'perspective'
    || value === 'isometric'
    || value === 'top-down'
    || value === 'classic'
}

export function readHmrCameraState(data: unknown): HmrCameraState | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const candidate = (data as Record<string, unknown>)[HMR_CAMERA_STATE_KEY]
  if (!candidate || typeof candidate !== 'object') {
    return null
  }

  const state = candidate as Record<string, unknown>
  if (
    !isCameraPreset(state.activeCameraMode)
    || !isFiniteTuple(state.position)
    || !isFiniteTuple(state.target)
    || (state.projection !== 'perspective' && state.projection !== 'orthographic')
  ) {
    return null
  }

  if (state.projection === 'perspective') {
    return {
      activeCameraMode: state.activeCameraMode,
      projection: 'perspective',
      position: state.position,
      target: state.target,
      fov: typeof state.fov === 'number' && Number.isFinite(state.fov) ? state.fov : 42,
    }
  }

  return {
    activeCameraMode: state.activeCameraMode,
    projection: 'orthographic',
    position: state.position,
    target: state.target,
    zoom: typeof state.zoom === 'number' && Number.isFinite(state.zoom) ? state.zoom : 1,
  }
}

export function writeHmrCameraState(data: Record<string, unknown>, state: HmrCameraState | null) {
  if (state) {
    data[HMR_CAMERA_STATE_KEY] = state
    return
  }

  delete data[HMR_CAMERA_STATE_KEY]
}
