import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import type { RegisteredEffectSource } from '../objectSourceRegistry'
import { buildActiveFireEmitters } from './fireParticleSystemShared'

describe('fireParticleSystem', () => {
  it('projects local emitter offsets through the object transform', () => {
    const emitters = buildActiveFireEmitters({
      effectSources: [
        createEffectSource('rotated', [2, 0.5, 4], [0, Math.PI / 2, 0], [{ offset: [0, 1, 0.5] }]),
      ],
      visibility: {
        getObjectVisibility: () => 'visible',
      },
      useLineOfSightPostMask: false,
    })

    expect(emitters).toMatchObject([{
      id: 'rotated:0',
      worldX: 2.5,
      worldY: 1.5,
      worldZ: 4,
    }])
  })

  it('culls fire emitters outside the camera frustum', () => {
    const emitters = buildActiveFireEmitters({
      effectSources: [
        createEffectSource('visible', [0, 0, -5]),
        createEffectSource('offscreen', [50, 0, -5]),
      ],
      visibility: {
        getObjectVisibility: () => 'visible',
      },
      useLineOfSightPostMask: false,
      cameraFrustum: createCameraFrustum(),
    })

    expect(emitters.map((emitter) => emitter.id)).toEqual(['visible:0'])
  })
})

function createEffectSource(
  id: string,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
  emitters: Array<{ offset?: [number, number, number] }> = [{ offset: [0, 0, 0] }],
): RegisteredEffectSource {
  return {
    key: id,
    object: {
      id,
      type: 'prop',
      assetId: 'dungeon.props_candle',
      position,
      rotation,
      props: {},
      cell: [0, 0],
      cellKey: '0:0:floor',
      layerId: 'default',
    },
    effect: {
      preset: 'fire',
      emitters,
    },
  }
}

function createCameraFrustum() {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camera.position.set(0, 0, 0)
  camera.lookAt(0, 0, -1)
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()
  return new THREE.Frustum().setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
  )
}
