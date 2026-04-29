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

import {
  buildRuntimePropBakedLightProbe,
  clearCachedObjectLocalBounds,
  getCachedObjectLocalBounds,
  measureObjectLocalBounds,
  measureObjectWorldBounds,
} from './runtimePropProbe'

describe('runtimePropProbe', () => {
  afterEach(() => {
    buildPropBakedLightProbeMock.mockReset()
    clearCachedObjectLocalBounds()
  })

  it('measures local bounds from the object hierarchy once', () => {
    const root = new THREE.Group()
    root.position.set(2, 0, -3)
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 4, 6),
      new THREE.MeshBasicMaterial(),
    )
    mesh.position.set(1, 2, 3)
    root.add(mesh)

    const bounds = measureObjectLocalBounds(root)

    expect(bounds?.min.toArray()).toEqual([0, 0, 0])
    expect(bounds?.max.toArray()).toEqual([2, 4, 6])
  })

  it('transforms cached local bounds into world-space bounds', () => {
    const root = new THREE.Group()
    root.position.set(2, 0, -3)
    root.rotation.y = Math.PI * 0.5
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 4, 6),
      new THREE.MeshBasicMaterial(),
    )
    mesh.position.set(1, 2, 3)
    root.add(mesh)

    const localBounds = measureObjectLocalBounds(root)
    const bounds = measureObjectWorldBounds(root, localBounds)

    expect(bounds?.min.toArray().map((value) => Number(value.toFixed(4)))).toEqual([2, 0, -5])
    expect(bounds?.max.toArray().map((value) => Number(value.toFixed(4)))).toEqual([8, 4, -3])
  })

  it('forwards transformed cached bounds into buildPropBakedLightProbe', () => {
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
    const localBounds = measureObjectLocalBounds(root)

    const probe = buildRuntimePropBakedLightProbe(lightField, root, localBounds)

    expect(probe).toBe(expectedProbe)
    expect(buildPropBakedLightProbeMock).toHaveBeenCalledTimes(1)
    expect(buildPropBakedLightProbeMock.mock.calls[0]?.[0]).toBe(lightField)
    const forwardedBounds = buildPropBakedLightProbeMock.mock.calls[0]?.[1] as THREE.Box3 | null
    expect(forwardedBounds?.min.toArray()).toEqual([-0.5, 0, -0.5])
    expect(forwardedBounds?.max.toArray()).toEqual([0.5, 2, 0.5])
  })

  it('reuses descriptor-cached local bounds for matching prop assets', () => {
    const root = new THREE.Group()
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 1),
      new THREE.MeshBasicMaterial(),
    )
    mesh.position.set(0, 1, 0)
    root.add(mesh)

    const cachedBounds = getCachedObjectLocalBounds('prop:torch', root)
    mesh.position.set(0, 3, 0)

    const reusedBounds = getCachedObjectLocalBounds('prop:torch', root)

    expect(reusedBounds).toBe(cachedBounds)
    expect(reusedBounds?.min.toArray()).toEqual([-0.5, 0, -0.5])
    expect(reusedBounds?.max.toArray()).toEqual([0.5, 2, 0.5])
  })

  it('does not freeze a descriptor cache key when bounds are temporarily unavailable', () => {
    const emptyRoot = new THREE.Group()

    expect(getCachedObjectLocalBounds('prop:empty', emptyRoot)).toBeNull()

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 1),
      new THREE.MeshBasicMaterial(),
    )
    mesh.position.set(0, 1, 0)
    emptyRoot.add(mesh)

    const resolvedBounds = getCachedObjectLocalBounds('prop:empty', emptyRoot)

    expect(resolvedBounds?.min.toArray()).toEqual([-0.5, 0, -0.5])
    expect(resolvedBounds?.max.toArray()).toEqual([0.5, 2, 0.5])
  })
})
