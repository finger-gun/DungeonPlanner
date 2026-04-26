import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { getAutofocusDistance, resolveAutofocusTarget } from './autofocusTarget'

describe('resolveAutofocusTarget', () => {
  it('prefers the orbit target over a raycast hit', () => {
    expect(
      resolveAutofocusTarget(
        true,
        { x: 1, y: 2, z: 3 },
        { x: 4, y: 5, z: 6 },
      ),
    ).toEqual({ x: 1, y: 2, z: 3 })
  })

  it('prefers the raycast hit when orbit target should not override it', () => {
    expect(
      resolveAutofocusTarget(
        false,
        { x: 1, y: 2, z: 3 },
        { x: 4, y: 5, z: 6 },
      ),
    ).toEqual({ x: 4, y: 5, z: 6 })
  })

  it('falls back to the raycast hit when no orbit target exists', () => {
    expect(
      resolveAutofocusTarget(
        true,
        null,
        { x: 4, y: 5, z: 6 },
      ),
    ).toEqual({ x: 4, y: 5, z: 6 })
  })

  it('uses camera-space depth instead of world-space straight-line distance', () => {
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0, 0)
    camera.lookAt(0, 0, -1)
    camera.updateMatrixWorld()
    camera.updateProjectionMatrix()

    expect(getAutofocusDistance(camera, { x: 0, y: 0, z: -10 })).toBeCloseTo(10)
    expect(getAutofocusDistance(camera, { x: 3, y: 0, z: -10 })).toBeCloseTo(10)
  })
})
