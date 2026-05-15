import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { captureHmrCameraState, readHmrCameraState, writeHmrCameraState } from './cameraHmrState'

describe('cameraHmrState', () => {
  it('captures perspective camera state', () => {
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 100)
    camera.position.set(1, 2, 3)
    const target = new THREE.Vector3(4, 5, 6)

    expect(captureHmrCameraState(camera, target, 'perspective')).toEqual({
      activeCameraMode: 'perspective',
      projection: 'perspective',
      position: [1, 2, 3],
      target: [4, 5, 6],
      fov: 58,
    })
  })

  it('captures orthographic camera state', () => {
    const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 100)
    camera.position.set(7, 8, 9)
    camera.zoom = 2.5
    const target = new THREE.Vector3(1, 0, -1)

    expect(captureHmrCameraState(camera, target, 'classic')).toEqual({
      activeCameraMode: 'classic',
      projection: 'orthographic',
      position: [7, 8, 9],
      target: [1, 0, -1],
      zoom: 2.5,
    })
  })

  it('round-trips persisted state and rejects invalid payloads', () => {
    const data: Record<string, unknown> = {}
    writeHmrCameraState(data, {
      activeCameraMode: 'top-down',
      projection: 'orthographic',
      position: [9, 11, 9],
      target: [0, 0, 0],
      zoom: 1.25,
    })

    expect(readHmrCameraState(data)).toEqual({
      activeCameraMode: 'top-down',
      projection: 'orthographic',
      position: [9, 11, 9],
      target: [0, 0, 0],
      zoom: 1.25,
    })
    expect(readHmrCameraState({ sceneCameraState: { projection: 'orthographic' } })).toBeNull()
  })
})
