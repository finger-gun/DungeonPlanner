import * as THREE from 'three'
import { afterEach, describe, expect, it, vi } from 'vitest'

const {
  buildPropBakedLightProbeMock,
  doesBoundsIntersectDirtyChunksMock,
  measureObjectWorldBoundsMock,
} = vi.hoisted(() => ({
  buildPropBakedLightProbeMock: vi.fn(),
  doesBoundsIntersectDirtyChunksMock: vi.fn(),
  measureObjectWorldBoundsMock: vi.fn(),
}))

vi.mock('./dungeonLightField', async () => {
  const actual = await vi.importActual<typeof import('./dungeonLightField')>('./dungeonLightField')
  return {
    ...actual,
    buildPropBakedLightProbe: buildPropBakedLightProbeMock,
    doesBoundsIntersectDirtyChunks: doesBoundsIntersectDirtyChunksMock,
  }
})

vi.mock('./runtimePropProbe', async () => {
  const actual = await vi.importActual<typeof import('./runtimePropProbe')>('./runtimePropProbe')
  return {
    ...actual,
    measureObjectWorldBounds: measureObjectWorldBoundsMock,
  }
})

import {
  clearRuntimePropLightingCache,
  getRuntimePropLightingDebugEntries,
  getCachedRuntimePropBakedLightProbe,
  pruneRuntimePropLightingCache,
  releaseCachedRuntimePropLightingProbe,
} from './propLightingCache'

function createLightField(
  overrides: Partial<import('./dungeonLightField').BakedFloorLightField> = {},
) {
  return {
    floorId: 'floor-1',
    chunkSize: 8,
    previousSourceHash: null,
    sourceHash: 'source-a',
    dirtyChunkKeySet: new Set<string>(),
    ...overrides,
  } as unknown as import('./dungeonLightField').BakedFloorLightField
}

function createBounds(min: readonly [number, number, number], max: readonly [number, number, number]) {
  return new THREE.Box3(
    new THREE.Vector3(...min),
    new THREE.Vector3(...max),
  )
}

describe('propLightingCache', () => {
  afterEach(() => {
    clearRuntimePropLightingCache()
    buildPropBakedLightProbeMock.mockReset()
    doesBoundsIntersectDirtyChunksMock.mockReset()
    measureObjectWorldBoundsMock.mockReset()
  })

  it('reuses a cached prop probe for the same floor source and bounds', () => {
    const object = new THREE.Object3D()
    const localBounds = createBounds([-0.5, 0, -0.5], [0.5, 2, 0.5])
    const worldBounds = createBounds([0, 0, 0], [1, 2, 1])
    const lightField = createLightField()
    const expectedProbe = { directionalStrength: 0.4 }
    measureObjectWorldBoundsMock.mockReturnValue(worldBounds)
    buildPropBakedLightProbeMock.mockReturnValue(expectedProbe)

    const firstProbe = getCachedRuntimePropBakedLightProbe({
      lightField,
      instanceKey: 'object-1',
      object,
      localBounds,
    })
    const secondProbe = getCachedRuntimePropBakedLightProbe({
      lightField,
      instanceKey: 'object-1',
      object,
      localBounds,
    })

    expect(firstProbe).toBe(expectedProbe)
    expect(secondProbe).toBe(expectedProbe)
    expect(buildPropBakedLightProbeMock).toHaveBeenCalledTimes(1)
  })

  it('promotes a cached probe across light-field revisions when dirty chunks do not overlap', () => {
    const object = new THREE.Object3D()
    const localBounds = createBounds([-0.5, 0, -0.5], [0.5, 2, 0.5])
    const worldBounds = createBounds([0, 0, 0], [1, 2, 1])
    const previousField = createLightField({
      sourceHash: 'source-a',
      previousSourceHash: null,
    })
    const nextField = createLightField({
      sourceHash: 'source-b',
      previousSourceHash: 'source-a',
    })
    const expectedProbe = { directionalStrength: 0.4 }
    measureObjectWorldBoundsMock.mockReturnValue(worldBounds)
    buildPropBakedLightProbeMock.mockReturnValue(expectedProbe)
    doesBoundsIntersectDirtyChunksMock.mockReturnValue(false)

    getCachedRuntimePropBakedLightProbe({
      lightField: previousField,
      instanceKey: 'object-1',
      object,
      localBounds,
    })
    const promotedProbe = getCachedRuntimePropBakedLightProbe({
      lightField: nextField,
      instanceKey: 'object-1',
      object,
      localBounds,
    })

    expect(promotedProbe).toBe(expectedProbe)
    expect(buildPropBakedLightProbeMock).toHaveBeenCalledTimes(1)
    expect(doesBoundsIntersectDirtyChunksMock).toHaveBeenCalledWith(nextField, worldBounds)
  })

  it('rebuilds a cached probe when dirty chunks overlap the prop bounds', () => {
    const object = new THREE.Object3D()
    const localBounds = createBounds([-0.5, 0, -0.5], [0.5, 2, 0.5])
    const worldBounds = createBounds([0, 0, 0], [1, 2, 1])
    const previousField = createLightField({
      sourceHash: 'source-a',
      previousSourceHash: null,
    })
    const nextField = createLightField({
      sourceHash: 'source-b',
      previousSourceHash: 'source-a',
    })
    measureObjectWorldBoundsMock.mockReturnValue(worldBounds)
    buildPropBakedLightProbeMock
      .mockReturnValueOnce({ directionalStrength: 0.4 })
      .mockReturnValueOnce({ directionalStrength: 0.6 })
    doesBoundsIntersectDirtyChunksMock.mockReturnValue(true)

    getCachedRuntimePropBakedLightProbe({
      lightField: previousField,
      instanceKey: 'object-1',
      object,
      localBounds,
    })
    const rebuiltProbe = getCachedRuntimePropBakedLightProbe({
      lightField: nextField,
      instanceKey: 'object-1',
      object,
      localBounds,
    })

    expect(rebuiltProbe).toEqual({ directionalStrength: 0.6 })
    expect(buildPropBakedLightProbeMock).toHaveBeenCalledTimes(2)
  })

  it('drops cached entries when a prop instance unmounts', () => {
    const object = new THREE.Object3D()
    const localBounds = createBounds([-0.5, 0, -0.5], [0.5, 2, 0.5])
    const worldBounds = createBounds([0, 0, 0], [1, 2, 1])
    const lightField = createLightField()
    measureObjectWorldBoundsMock.mockReturnValue(worldBounds)
    buildPropBakedLightProbeMock
      .mockReturnValueOnce({ directionalStrength: 0.4 })
      .mockReturnValueOnce({ directionalStrength: 0.6 })

    getCachedRuntimePropBakedLightProbe({
      lightField,
      instanceKey: 'object-1',
      object,
      localBounds,
    })
    releaseCachedRuntimePropLightingProbe(lightField.floorId, 'object-1')
    const rebuiltProbe = getCachedRuntimePropBakedLightProbe({
      lightField,
      instanceKey: 'object-1',
      object,
      localBounds,
    })

    expect(rebuiltProbe).toEqual({ directionalStrength: 0.6 })
    expect(buildPropBakedLightProbeMock).toHaveBeenCalledTimes(2)
  })

  it('exposes cached probe entries for the debug visualizer', () => {
    const object = new THREE.Object3D()
    const localBounds = createBounds([-0.5, 0, -0.5], [0.5, 2, 0.5])
    const worldBounds = createBounds([0, 0, 0], [1, 2, 1])
    const lightField = createLightField()
    measureObjectWorldBoundsMock.mockReturnValue(worldBounds)
    buildPropBakedLightProbeMock.mockReturnValue({
      baseLight: [0.2, 0.1, 0.05],
      topLight: [0.3, 0.2, 0.1],
      baseY: 0.4,
      topY: 1.6,
      lightDirection: [1, 0, 0],
      directionalStrength: 0.5,
    })

    getCachedRuntimePropBakedLightProbe({
      lightField,
      instanceKey: 'object-1',
      object,
      localBounds,
    })
    const entries = getRuntimePropLightingDebugEntries(lightField.floorId)

    expect(entries).toHaveLength(1)
    expect(entries[0]?.instanceKey).toBe('object-1')
    expect(entries[0]?.worldBounds.min.toArray()).toEqual([0, 0, 0])
    expect(entries[0]?.probe.baseLight).toEqual([0.2, 0.1, 0.05])
  })

  it('prunes cached probe entries for floors that no longer exist', () => {
    const object = new THREE.Object3D()
    const localBounds = createBounds([-0.5, 0, -0.5], [0.5, 2, 0.5])
    const worldBounds = createBounds([0, 0, 0], [1, 2, 1])
    const activeFloor = createLightField({ floorId: 'floor-1' })
    const removedFloor = createLightField({ floorId: 'floor-2' })
    measureObjectWorldBoundsMock.mockReturnValue(worldBounds)
    buildPropBakedLightProbeMock.mockReturnValue({
      baseLight: [0.2, 0.1, 0.05],
      topLight: [0.3, 0.2, 0.1],
      baseY: 0.4,
      topY: 1.6,
      lightDirection: [1, 0, 0],
      directionalStrength: 0.5,
    })

    getCachedRuntimePropBakedLightProbe({
      lightField: activeFloor,
      instanceKey: 'object-1',
      object,
      localBounds,
    })
    getCachedRuntimePropBakedLightProbe({
      lightField: removedFloor,
      instanceKey: 'object-2',
      object,
      localBounds,
    })

    pruneRuntimePropLightingCache(['floor-1'])

    expect(getRuntimePropLightingDebugEntries('floor-1')).toHaveLength(1)
    expect(getRuntimePropLightingDebugEntries('floor-2')).toHaveLength(0)
  })
})
