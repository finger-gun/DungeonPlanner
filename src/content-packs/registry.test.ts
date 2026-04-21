import { describe, expect, it } from 'vitest'
import { getMetadataConnectors } from './connectors'
import { getContentPackAssetById, getDefaultAssetIdByCategory } from './registry'
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

  it('registers the dungeon pack floor, wall, and expanded prop assets', () => {
    expect(getContentPackAssetById('dungeon.floor_floor_tile_small')).toMatchObject({
      category: 'floor',
      name: 'Dungeon Floor Tile Small',
    })
    expect(getContentPackAssetById('dungeon.wall_wall')).toMatchObject({
      category: 'wall',
      name: 'Dungeon Wall',
      metadata: {
        wallSpan: 1,
        wallCornerType: 'solitary',
      },
    })
    expect(getContentPackAssetById('dungeon.wall_wall_arched')).toMatchObject({
      category: 'wall',
      name: 'Dungeon Wall Arched',
      metadata: {
        wallSpan: 1,
        wallCornerType: 'solitary',
      },
    })
    expect(getContentPackAssetById('dungeon.wall_wall_cracked')).toMatchObject({
      category: 'wall',
      name: 'Dungeon Wall Cracked',
    })
    expect(getContentPackAssetById('dungeon.wall_wall_scaffold')).toMatchObject({
      category: 'wall',
      name: 'Dungeon Wall Scaffold',
      metadata: {
        wallSpan: 1,
        wallCornerType: 'solitary',
      },
    })
    const smallDoor = getContentPackAssetById('core.opening_door_wall_1')
    const largeDoor = getContentPackAssetById('core.opening_door_wall_3')
    const staircaseUp = getContentPackAssetById('core.props_staircase_up')
    if (smallDoor) {
      expect(smallDoor.metadata?.openingWidth).toBe(1)
    } else {
      expect(smallDoor).toBeNull()
    }
    if (largeDoor) {
      expect(largeDoor.metadata?.openingWidth).toBe(3)
    } else {
      expect(largeDoor).toBeNull()
    }
    if (staircaseUp) {
      expect(staircaseUp.metadata?.pairedAssetId).toBe('core.props_staircase_down')
    } else {
      expect(staircaseUp).toBeNull()
    }
    expect(getMetadataConnectors(getContentPackAssetById('dungeon.props_shelves')?.metadata)[0]?.type).toBe('WALL')
    expect(getContentPackAssetById('dungeon.props_chair')).toMatchObject({
      category: 'prop',
      name: 'Dungeon Chair',
      metadata: {
        blocksLineOfSight: false,
      },
    })
    expect(getContentPackAssetById('dungeon.props_table_long_tablecloth')).toMatchObject({
      category: 'prop',
      name: 'Dungeon Table Long Tablecloth',
    })
    expect(getContentPackAssetById('dungeon.stairs_stairs')).toMatchObject({
      category: 'opening',
      metadata: {
        snapsTo: 'GRID',
        stairDirection: 'down',
      },
    })
    expect(getContentPackAssetById('dungeon.stairs_stairs_wood')).toMatchObject({
      category: 'opening',
      name: 'Dungeon Stairs Wood Down',
      metadata: {
        stairDirection: 'down',
        pairedAssetId: 'dungeon.stairs_stairs_wood_up',
      },
    })
    expect(getContentPackAssetById('dungeon.stairs_stairs_wood_up')).toMatchObject({
      category: 'opening',
      name: 'Dungeon Stairs Wood Up',
      metadata: {
        snapsTo: 'GRID',
        stairDirection: 'up',
        pairedAssetId: 'dungeon.stairs_stairs_wood',
      },
    })
    const woodDownTransform = getContentPackAssetById('dungeon.stairs_stairs_wood')?.batchRender?.transform
    const woodUpTransform = getContentPackAssetById('dungeon.stairs_stairs_wood_up')?.batchRender?.transform
    expect(typeof woodDownTransform).not.toBe('function')
    expect(typeof woodUpTransform).not.toBe('function')
    if (woodDownTransform && typeof woodDownTransform !== 'function') {
      expect(woodDownTransform.position).toEqual([0, -2, -1])
    }
    if (woodUpTransform && typeof woodUpTransform !== 'function') {
      expect(woodUpTransform.position).toEqual([0, 0, -1])
    }
    expect(getContentPackAssetById('dungeon.stairs_stairs_modular_center')).toBeNull()
    expect(getContentPackAssetById('dungeon.stairs_stairs_modular_left')).toBeNull()
    expect(getContentPackAssetById('dungeon.stairs_stairs_modular_right')).toBeNull()
    expect(getContentPackAssetById('dungeon.stairs_stairs_long_modular_center')).toBeNull()
    expect(getContentPackAssetById('dungeon.stairs_stairs_long_modular_left')).toBeNull()
    expect(getContentPackAssetById('dungeon.stairs_stairs_long_modular_right')).toBeNull()
    expect(getContentPackAssetById('kaykit.opening_stairs_modular_center_up')).toBeNull()
    expect(getContentPackAssetById('kaykit.opening_stairs_modular_left_up')).toBeNull()
    expect(getContentPackAssetById('kaykit.opening_stairs_modular_right_up')).toBeNull()
    expect(getContentPackAssetById('kaykit.opening_stairs_long_modular_center_up')).toBeNull()
    expect(getContentPackAssetById('kaykit.opening_stairs_long_modular_left_up')).toBeNull()
    expect(getContentPackAssetById('kaykit.opening_stairs_long_modular_right_up')).toBeNull()
  })

  it('resolves dungeon defaults from actual imported assets', () => {
    expect(getDefaultAssetIdByCategory('floor')).toBe('dungeon.floor_floor_tile_small')
    expect(getDefaultAssetIdByCategory('wall')).toBe('dungeon.wall_wall')
    expect(getDefaultAssetIdByCategory('opening')).toBe('dungeon.stairs_stairs')
    expect(getDefaultAssetIdByCategory('prop')).toBe('dungeon.props_torch_lit')
  })

  it('exposes free-prop connectors and prop surfaces in content metadata', () => {
    expect(getMetadataConnectors(getContentPackAssetById('dungeon.props_candle_lit')?.metadata)[0]?.type).toBe('FLOOR')
    expect(getMetadataConnectors(getContentPackAssetById('dungeon.props_candle_triple')?.metadata)[0]?.type).toBe('FLOOR')
    expect(getContentPackAssetById('dungeon.props_bookcase_double')?.metadata?.propSurface).toBe(true)
    expect(getContentPackAssetById('dungeon.props_bookcase_single')?.metadata?.propSurface).toBe(true)
    expect(getContentPackAssetById('dungeon.props_table_medium')?.metadata?.propSurface).toBe(true)
  })
})
