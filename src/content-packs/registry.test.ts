import { describe, expect, it } from 'vitest'
import { getContentPackAssetById } from './registry'
import { syncGeneratedCharacterAssets } from './runtimeRegistry'

describe('content pack registry', () => {
  it('does not register the removed core player assets anymore', () => {
    expect(getContentPackAssetById('core.player_barbarian')).toBeNull()
    expect(getContentPackAssetById('core.player_knight')).toBeNull()
    expect(getContentPackAssetById('core.player_mage')).toBeNull()
    expect(getContentPackAssetById('core.player_ranger')).toBeNull()
    expect(getContentPackAssetById('core.player_rogue')).toBeNull()
    expect(getContentPackAssetById('core.player_rogue_hooded')).toBeNull()
  })

  it('keeps pillar and rubble props non-blocking for LOS', () => {
    expect(getContentPackAssetById('core.props_pillar')?.metadata?.blocksLineOfSight).toBe(false)
    expect(getContentPackAssetById('core.props_rubble')?.metadata?.blocksLineOfSight).toBe(false)
  })

  it('registers a play-toggleable wall torch with dynamic light state', () => {
    const asset = getContentPackAssetById('core.props_wall_torch')

    expect(asset?.getPlayModeNextProps?.({ lit: true })).toEqual({ lit: false })
    expect(asset?.getPlayModeNextProps?.({ lit: false })).toEqual({ lit: true })
    expect(asset?.getLight?.({})).toMatchObject({ intensity: 5, flicker: true })
    expect(asset?.getLight?.({ lit: false })).toBeNull()
  })

  it('surfaces generated standees through the runtime registry', () => {
    syncGeneratedCharacterAssets({
      'generated.player.test': {
        assetId: 'generated.player.test',
        storageId: 'storage-test',
        name: 'Generated Ranger',
        kind: 'player',
        prompt: 'A ranger on white background',
        model: 'x/z-image-turbo',
        size: 'M',
        originalImageUrl: 'data:image/png;base64,abc',
        processedImageUrl: 'data:image/png;base64,abc',
        thumbnailUrl: 'data:image/png;base64,abc',
        width: 300,
        height: 600,
        createdAt: '2026-04-16T00:00:00.000Z',
        updatedAt: '2026-04-16T00:00:00.000Z',
      },
    })

    expect(getContentPackAssetById('generated.player.test')).toMatchObject({
      id: 'generated.player.test',
      name: 'Generated Ranger',
      category: 'player',
      thumbnailUrl: 'data:image/png;base64,abc',
    })

    syncGeneratedCharacterAssets({})
  })
})
