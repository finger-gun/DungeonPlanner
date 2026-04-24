import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import type { RegisteredEffectSource } from '../objectSourceRegistry'
import { buildActiveFireEmitters } from './fireParticleSystem'

describe('fireParticleSystem', () => {
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
): RegisteredEffectSource {
  return {
    key: id,
    object: {
      id,
      type: 'prop',
      assetId: 'dungeon.props_candle',
      position,
      rotation: [0, 0, 0],
      props: {},
      cell: [0, 0],
      cellKey: '0:0:floor',
      layerId: 'default',
    },
    effect: {
      preset: 'fire',
      emitters: [{ offset: [0, 0, 0] }],
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
