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
    const pillar = getContentPackAssetById('core.props_pillar')
    const rubble = getContentPackAssetById('core.props_rubble')

    if (pillar) {
      expect(pillar.metadata?.blocksLineOfSight).toBe(false)
    } else {
      expect(pillar).toBeNull()
    }

    if (rubble) {
      expect(rubble.metadata?.blocksLineOfSight).toBe(false)
    } else {
      expect(rubble).toBeNull()
    }
  })

  it('registers a play-toggleable wall torch with dynamic light state', () => {
    const asset = getContentPackAssetById('core.props_wall_torch')

    if (!asset) {
      expect(asset).toBeNull()
      return
    }

    expect(asset.getPlayModeNextProps?.({ lit: true })).toEqual({ lit: false })
    expect(asset.getPlayModeNextProps?.({ lit: false })).toEqual({ lit: true })
    expect(asset.getLight?.({})).toMatchObject({ intensity: 5, flicker: true })
    expect(asset.getLight?.({ lit: false })).toBeNull()
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

  it('registers the KayKit pack floor, wall, and expanded prop assets', () => {
    expect(getContentPackAssetById('kaykit.floor_tile_small')).toMatchObject({
      category: 'floor',
      name: 'KayKit Stone Floor',
    })
    expect(getContentPackAssetById('kaykit.wall')).toMatchObject({
      category: 'wall',
      name: 'KayKit Wall',
      metadata: {
        wallSpan: 1,
        wallCornerType: 'solitary',
      },
    })
    expect(getContentPackAssetById('kaykit.opening_wall_doorway')?.metadata?.openingWidth).toBe(1)
    expect(getContentPackAssetById('kaykit.opening_stairs_up')?.metadata?.pairedAssetId).toBe('kaykit.opening_stairs_down')
    expect(getContentPackAssetById('kaykit.props_wall_shelves')?.metadata?.connectsTo).toBe('WALL')
    expect(getContentPackAssetById('kaykit.props_chair')).toMatchObject({
      category: 'prop',
      name: 'KayKit Chair',
      metadata: {
        connectsTo: 'FREE',
        blocksLineOfSight: false,
      },
    })
    expect(getContentPackAssetById('kaykit.props_table_long_tablecloth')).toMatchObject({
      category: 'prop',
      name: 'KayKit Long Table Tablecloth',
    })
    expect(getContentPackAssetById('kaykit.opening_stairs_up')).toMatchObject({
      category: 'opening',
      metadata: {
        connectsTo: 'FLOOR',
        stairDirection: 'up',
        pairedAssetId: 'kaykit.opening_stairs_down',
      },
    })
    expect(getContentPackAssetById('kaykit.opening_stairs_modular_center_up')).toBeNull()
    expect(getContentPackAssetById('kaykit.opening_stairs_long_modular_center_up')).toBeNull()
  })

  it('exposes free-prop connectors and prop surfaces in content metadata', () => {
    expect(getContentPackAssetById('kaykit.props_candle_lit')?.metadata?.connectsTo).toBe('FREE')
    expect(getContentPackAssetById('kaykit.props_candle_triple')?.metadata?.connectsTo).toBe('FREE')
    expect(getContentPackAssetById('kaykit.props_box_large')?.metadata?.propSurface).toBe(true)
    expect(getContentPackAssetById('kaykit.props_table_small')?.metadata?.propSurface).toBe(true)
    expect(getContentPackAssetById('kaykit.props_table_long_tablecloth')?.metadata?.propSurface).toBe(true)
  })
})
