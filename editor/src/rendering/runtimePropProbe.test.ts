import * as THREE from 'three'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { buildPropBakedLightProbeMock } = vi.hoisted(() => ({
  buildPropBakedLightProbeMock: vi.fn(),
}))

vi.mock('./dungeonLightField', async () => {
  const actual = await vi.importActual<typeof import('./dungeonLightField')>('./dungeonLightField')
  return {
    ...actual,
    buildPropBakedLightProbe: buildPropBakedLightProbeMock,
  }
})

import { buildRuntimePropBakedLightProbe, measureObjectWorldBounds } from './runtimePropProbe'

describe('runtimePropProbe', () => {
  afterEach(() => {
    buildPropBakedLightProbeMock.mockReset()
  })

  it('measures world-space bounds from the mounted object hierarchy', () => {
    const root = new THREE.Group()
    root.position.set(2, 0, -3)
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 4, 6),
      new THREE.MeshBasicMaterial(),
    )
    mesh.position.set(1, 2, 3)
    root.add(mesh)

    const bounds = measureObjectWorldBounds(root)

    expect(bounds?.min.toArray()).toEqual([2, 0, -3])
    expect(bounds?.max.toArray()).toEqual([4, 4, 3])
  })

  it('forwards measured bounds into buildPropBakedLightProbe', () => {
    const root = new THREE.Group()
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 1),
      new THREE.MeshBasicMaterial(),
    )
    mesh.position.set(0, 1, 0)
    root.add(mesh)

    const lightField = { floorId: 'floor-1' } as unknown as import('./dungeonLightField').BakedFloorLightField
    const expectedProbe = { directionalStrength: 0.4 }
    buildPropBakedLightProbeMock.mockReturnValue(expectedProbe)

    const probe = buildRuntimePropBakedLightProbe(lightField, root)

    expect(probe).toBe(expectedProbe)
    expect(buildPropBakedLightProbeMock).toHaveBeenCalledTimes(1)
    expect(buildPropBakedLightProbeMock.mock.calls[0]?.[0]).toBe(lightField)
    const forwardedBounds = buildPropBakedLightProbeMock.mock.calls[0]?.[1] as THREE.Box3 | null
    expect(forwardedBounds?.min.toArray()).toEqual([-0.5, 0, -0.5])
    expect(forwardedBounds?.max.toArray()).toEqual([0.5, 2, 0.5])
  })
})
