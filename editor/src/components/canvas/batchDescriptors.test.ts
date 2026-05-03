import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildBatchDescriptors, getRenderBatchChunkKeyForCell } from './batchDescriptors'
import type { StaticTileEntry } from './BatchedTileEntries'
import * as tileAssetResolution from './tileAssetResolution'

describe('buildBatchDescriptors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should separate batchable and fallback entries', () => {
    const resolveSpy = vi.spyOn(tileAssetResolution, 'resolveBatchedTileAsset')
    resolveSpy.mockImplementation((assetId) => {
      if (assetId === 'floor-tile') {
        return {
          assetUrl: '/assets/floor.glb',
          transformKey: 'default',
          receiveShadow: true,
        }
      }
      return null
    })

    const entries: StaticTileEntry[] = [
      {
        key: 'floor:0:0',
        assetId: 'floor-tile',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'visible',
      },
      {
        key: 'floor:1:1',
        assetId: 'unknown-asset',
        position: [1, 0, 1],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'visible',
      },
    ]

    const result = buildBatchDescriptors(entries, false)

    expect(result.batched).toHaveLength(1)
    expect(result.batched[0]!.entries).toHaveLength(1)
    expect(result.batched[0]!.entries[0]!.assetId).toBe('floor-tile')
    expect(result.fallback).toHaveLength(1)
    expect(result.fallback[0]!.assetId).toBe('unknown-asset')
  })

  it('should derive chunk keys from cell coordinates using the shared chunk helper', () => {
    expect(getRenderBatchChunkKeyForCell([0, 0])).toBe('0:0')
    expect(getRenderBatchChunkKeyForCell([8, 8])).toBe('0:0')
    expect(getRenderBatchChunkKeyForCell([9, 0])).toBe('1:0')
    expect(getRenderBatchChunkKeyForCell([16, 0])).toBe('1:0')
  })

  it('should group entries by compatibility bucket', () => {
    const resolveSpy = vi.spyOn(tileAssetResolution, 'resolveBatchedTileAsset')
    resolveSpy.mockImplementation((assetId) => {
      if (assetId === 'floor-tile') {
        return {
          assetUrl: '/assets/floor.glb',
          transformKey: 'default',
          receiveShadow: true,
        }
      }
      if (assetId === 'wall-tile') {
        return {
          assetUrl: '/assets/wall.glb',
          transformKey: 'default',
          receiveShadow: true,
        }
      }
      return null
    })

    const entries: StaticTileEntry[] = [
      {
        key: 'floor:0:0',
        assetId: 'floor-tile',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'visible',
      },
      {
        key: 'floor:1:1',
        assetId: 'floor-tile',
        position: [1, 0, 1],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'visible',
      },
      {
        key: 'wall:2:2',
        assetId: 'wall-tile',
        position: [2, 0, 2],
        rotation: [0, 0, 0],
        variant: 'wall',
        visibility: 'visible',
      },
    ]

    const result = buildBatchDescriptors(entries, false)

    expect(result.batched).toHaveLength(2)
    const floorBucket = result.batched.find((desc) => desc.assetUrl === '/assets/floor.glb')
    const wallBucket = result.batched.find((desc) => desc.assetUrl === '/assets/wall.glb')

    expect(floorBucket?.entries).toHaveLength(2)
    expect(wallBucket?.entries).toHaveLength(1)
  })

  it('should split compatible entries across spatial chunks', () => {
    const resolveSpy = vi.spyOn(tileAssetResolution, 'resolveBatchedTileAsset')
    resolveSpy.mockImplementation(() => ({
      assetUrl: '/assets/floor.glb',
      transformKey: 'default',
      receiveShadow: true,
    }))

    const entries: StaticTileEntry[] = [
      {
        key: 'floor:0:0',
        assetId: 'floor-tile',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        variant: 'floor',
        variantKey: '0:0',
        visibility: 'visible',
      },
      {
        key: 'floor:16:0',
        assetId: 'floor-tile',
        position: [16, 0, 0],
        rotation: [0, 0, 0],
        variant: 'floor',
        variantKey: '16:0',
        visibility: 'visible',
      },
    ]

    const result = buildBatchDescriptors(entries, false)

    expect(result.batched).toHaveLength(2)
    expect(result.batched.map((descriptor) => descriptor.chunkKey).sort()).toEqual(['0:0', '1:0'])
  })

  it('should respect GPU fog for floor variant', () => {
    const resolveSpy = vi.spyOn(tileAssetResolution, 'resolveBatchedTileAsset')
    resolveSpy.mockImplementation(() => ({
      assetUrl: '/assets/floor.glb',
      transformKey: 'default',
      receiveShadow: true,
    }))

    const entries: StaticTileEntry[] = [
      {
        key: 'floor:0:0',
        assetId: 'floor-tile',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'visible',
        fogCell: [0, 0],
      },
    ]

    const resultWithFog = buildBatchDescriptors(entries, true)
    const resultWithoutFog = buildBatchDescriptors(entries, false)

    expect(resultWithFog.batched[0]!.usesGpuFog).toBe(true)
    expect(resultWithoutFog.batched[0]!.usesGpuFog).toBe(false)
    expect(resultWithFog.batched[0]!.bucketKey).not.toBe(resultWithoutFog.batched[0]!.bucketKey)
  })

  it('should separate entries by visibility state', () => {
    const resolveSpy = vi.spyOn(tileAssetResolution, 'resolveBatchedTileAsset')
    resolveSpy.mockImplementation(() => ({
      assetUrl: '/assets/floor.glb',
      transformKey: 'default',
      receiveShadow: true,
    }))

    const entries: StaticTileEntry[] = [
      {
        key: 'floor:0:0',
        assetId: 'floor-tile',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'visible',
      },
      {
        key: 'floor:1:1',
        assetId: 'floor-tile',
        position: [1, 0, 1],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'explored',
      },
    ]

    const result = buildBatchDescriptors(entries, false)

    expect(result.batched).toHaveLength(2)
    const visibleBucket = result.batched.find((desc) => desc.bucketKey.includes('visible'))
    const exploredBucket = result.batched.find((desc) => desc.bucketKey.includes('explored'))

    expect(visibleBucket?.entries).toHaveLength(1)
    expect(exploredBucket?.entries).toHaveLength(1)
  })

  it('should separate entries by shadow configuration', () => {
    const resolveSpy = vi.spyOn(tileAssetResolution, 'resolveBatchedTileAsset')
    resolveSpy.mockImplementation((assetId) => ({
      assetUrl: '/assets/floor.glb',
      transformKey: 'default',
      receiveShadow: assetId === 'floor-shadow',
    }))

    const entries: StaticTileEntry[] = [
      {
        key: 'floor:0:0',
        assetId: 'floor-shadow',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'visible',
      },
      {
        key: 'floor:1:1',
        assetId: 'floor-flat',
        position: [1, 0, 1],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'visible',
      },
    ]

    const result = buildBatchDescriptors(entries, false)

    expect(result.batched).toHaveLength(2)
    const shadowBucket = result.batched.find((desc) => desc.bucketKey.includes('shadow'))
    const flatBucket = result.batched.find((desc) => desc.bucketKey.includes('flat'))

    expect(shadowBucket?.entries).toHaveLength(1)
    expect(flatBucket?.entries).toHaveLength(1)
  })

  it('should separate entries by baked light direction', () => {
    const resolveSpy = vi.spyOn(tileAssetResolution, 'resolveBatchedTileAsset')
    resolveSpy.mockImplementation(() => ({
      assetUrl: '/assets/wall.glb',
      transformKey: 'default',
      receiveShadow: true,
    }))

    const entries: StaticTileEntry[] = [
      {
        key: 'wall:0:0',
        assetId: 'wall-tile',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        variant: 'wall',
        visibility: 'visible',
        bakedLightDirection: [1, 0, 0],
      },
      {
        key: 'wall:1:1',
        assetId: 'wall-tile',
        position: [1, 0, 1],
        rotation: [0, 0, 0],
        variant: 'wall',
        visibility: 'visible',
        bakedLightDirection: [1, 0, 0],
        bakedLightDirectionSecondary: [0, 0, 1],
      },
    ]

    const result = buildBatchDescriptors(entries, false)

    expect(result.batched).toHaveLength(2)
    const singleDirection = result.batched.find((desc) => desc.bucketKey.includes('single-direction'))
    const doubleDirection = result.batched.find((desc) => desc.bucketKey.includes('double-direction'))

    expect(singleDirection?.entries).toHaveLength(1)
    expect(doubleDirection?.entries).toHaveLength(1)
  })

  it('keeps geometry signatures stable when only legacy bakedLight samples differ', () => {
    const resolveSpy = vi.spyOn(tileAssetResolution, 'resolveBatchedTileAsset')
    resolveSpy.mockImplementation(() => ({
      assetUrl: '/assets/floor.glb',
      transformKey: 'default',
      receiveShadow: true,
    }))

    const firstResult = buildBatchDescriptors([
      {
        key: 'floor:0:0',
        assetId: 'floor-tile',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'visible',
        bakedLight: [0.1, 0.2, 0.3],
      },
    ], false)
    const secondResult = buildBatchDescriptors([
      {
        key: 'floor:0:0',
        assetId: 'floor-tile',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'visible',
        bakedLight: [0.8, 0.6, 0.4],
      },
    ], false)

    expect(firstResult.batched[0]?.geometrySignature).toBe(secondResult.batched[0]?.geometrySignature)
  })

  it('changes geometry signatures when build animation timing changes', () => {
    const resolveSpy = vi.spyOn(tileAssetResolution, 'resolveBatchedTileAsset')
    resolveSpy.mockImplementation(() => ({
      assetUrl: '/assets/floor.glb',
      transformKey: 'default',
      receiveShadow: true,
    }))

    const firstResult = buildBatchDescriptors([
      {
        key: 'floor:0:0',
        assetId: 'floor-tile',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'visible',
        buildAnimationStart: 1000,
        buildAnimationDelay: 0,
      },
    ], false)
    const secondResult = buildBatchDescriptors([
      {
        key: 'floor:0:0',
        assetId: 'floor-tile',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'visible',
        buildAnimationStart: 1000,
        buildAnimationDelay: 160,
      },
    ], false)

    expect(firstResult.batched[0]?.geometrySignature).not.toBe(secondResult.batched[0]?.geometrySignature)
  })

  it('keeps animated and static build entries in the same stable bucket', () => {
    const resolveSpy = vi.spyOn(tileAssetResolution, 'resolveBatchedTileAsset')
    resolveSpy.mockImplementation(() => ({
      assetUrl: '/assets/floor.glb',
      transformKey: 'default',
      receiveShadow: true,
    }))

    const result = buildBatchDescriptors([
      {
        key: 'floor:0:0',
        assetId: 'floor-tile',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'visible',
      },
      {
        key: 'floor:1:0',
        assetId: 'floor-tile',
        position: [1, 0, 0],
        rotation: [0, 0, 0],
        variant: 'floor',
        visibility: 'visible',
        buildAnimationStart: 1000,
        buildAnimationDelay: 80,
      },
    ], false)

    expect(result.batched).toHaveLength(1)
    expect(result.batched[0]?.entries).toHaveLength(2)
    expect(result.batched[0]?.bucketKey).not.toContain('animated-build')
    expect(result.batched[0]?.bucketKey).not.toContain('static-build')
  })

  it('should handle empty input', () => {
    const result = buildBatchDescriptors([], false)

    expect(result.batched).toHaveLength(0)
    expect(result.fallback).toHaveLength(0)
  })
})
