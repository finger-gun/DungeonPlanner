import { describe, expect, it } from 'vitest'
import { getContentPackAssetById } from '../../content-packs/registry'
import {
  resolveBatchedTileAsset,
  resolveProjectionReceiverAsset,
} from './tileAssetResolution'

describe('tileAssetResolution', () => {
  it('resolves batched floor assets with their authored transform', () => {
    const asset = getContentPackAssetById('kaykit.floor_tile_small')
    const resolved = resolveBatchedTileAsset('kaykit.floor_tile_small', '1:2')

    expect(resolved).not.toBeNull()
    expect(resolved?.assetUrl).toBe(asset?.assetUrl)
    expect(resolved?.transform?.position).toEqual([0, -0.05, 0])
    expect(resolved?.receiveShadow).toBe(true)
  })

  it('resolves wall corners through the batch render contract', () => {
    const asset = getContentPackAssetById('kaykit.wall')
    const resolved = resolveBatchedTileAsset('kaykit.wall', '4:5:north', { kind: 'corner' })

    expect(resolved).not.toBeNull()
    expect(resolved?.assetUrl).not.toBe(asset?.assetUrl)
    expect(resolved?.transform?.rotation).toEqual([0, Math.PI * 1.5, 0])
  })

  it('resolves floor projection receivers through the shared helper', () => {
    const asset = getContentPackAssetById('kaykit.floor_tile_small')
    const resolved = resolveProjectionReceiverAsset('kaykit.floor_tile_small', '1:2')

    expect(resolved).not.toBeNull()
    expect(resolved?.assetUrl).toBe(asset?.assetUrl)
    expect(resolved?.transform?.position).toEqual([0, -0.05, 0])
  })

  it('falls back to the asset url when no dedicated projection receiver exists', () => {
    const asset = getContentPackAssetById('kaykit.wall')

    expect(resolveProjectionReceiverAsset('kaykit.wall')).toEqual({
      assetUrl: asset?.assetUrl,
      transform: undefined,
      transformKey: 'default',
    })
  })
})
