import { describe, expect, it } from 'vitest'
import { getContentPackAssetById, getDefaultAssetIdByCategory } from '../content-packs/registry'
import type { DungeonObjectRecord } from './useDungeonStore'
import {
  sanitizePersistedAssetReferences,
  sanitizeSelectedAssetIds,
  sanitizeSnapshotAssetReferences,
} from './assetReferences'

function createSnapshot() {
  return {
    tool: 'select' as const,
    selectedAssetIds: {
      floor: 'missing.floor',
      wall: 'missing.wall',
      prop: 'missing.prop',
      opening: 'missing.opening',
      player: 'missing.player',
    },
    selection: null,
    layers: { default: { id: 'default', name: 'Default', visible: true, locked: false } },
    layerOrder: ['default'],
    activeLayerId: 'default',
    rooms: {
      room1: {
        id: 'room1',
        name: 'Room 1',
        layerId: 'default',
        floorAssetId: 'missing.floor',
        wallAssetId: 'missing.wall',
      },
    },
    paintedCells: {},
    blockedCells: {},
    outdoorTerrainHeights: {},
    outdoorTerrainStyleCells: {},
    exploredCells: {},
    floorTileAssetIds: {},
    wallSurfaceAssetIds: {},
    wallSurfaceProps: {},
    placedObjects: {} as Record<string, DungeonObjectRecord>,
    wallOpenings: {
      opening1: {
        id: 'opening1',
        assetId: 'missing.opening',
        wallKey: '0:0:north',
        width: 1 as 1 | 2 | 3,
        flipped: false,
        layerId: 'default',
      },
    },
    innerWalls: {},
    occupancy: {},
    nextRoomNumber: 1,
  }
}

describe('asset reference sanitization', () => {
  it('replaces invalid selected asset ids with category defaults', () => {
    expect(
      sanitizeSelectedAssetIds({
        floor: 'missing.floor',
        wall: 'missing.wall',
        prop: 'missing.prop',
        opening: 'missing.opening',
        player: 'missing.player',
      }),
    ).toEqual({
      floor: getDefaultAssetIdByCategory('floor'),
      wall: getDefaultAssetIdByCategory('wall'),
      prop: getDefaultAssetIdByCategory('prop'),
      opening: getDefaultAssetIdByCategory('opening'),
      player: getDefaultAssetIdByCategory('player'),
    })
  })

  it('clears invalid room and opening overrides', () => {
    const snapshot = sanitizeSnapshotAssetReferences(createSnapshot())

    expect(snapshot.rooms.room1.floorAssetId).toBeNull()
    expect(snapshot.rooms.room1.wallAssetId).toBeNull()
    expect(snapshot.wallOpenings.opening1.assetId).toBeNull()
  })

  it('realigns opening widths to current asset metadata', () => {
    const wallOpeningAsset = getContentPackAssetById('core.opening_door_wall_1')
    const snapshot = createSnapshot()
    snapshot.wallOpenings.opening1 = {
      ...snapshot.wallOpenings.opening1,
      assetId: 'core.opening_door_wall_1',
      width: 2,
    }

    const sanitized = sanitizeSnapshotAssetReferences(snapshot)

    if (wallOpeningAsset) {
      expect(sanitized.wallOpenings.opening1.assetId).toBe('core.opening_door_wall_1')
      expect(sanitized.wallOpenings.opening1.width).toBe(1)
    } else {
      expect(sanitized.wallOpenings.opening1.assetId).toBeNull()
    }
  })

  it('drops invalid floor and wall surface overrides', () => {
    const snapshot = createSnapshot()
    ;(snapshot.floorTileAssetIds as Record<string, string>)['0:0'] = 'missing.floor'
    ;(snapshot.wallSurfaceAssetIds as Record<string, string>)['0:0:north'] = 'missing.wall'

    const sanitized = sanitizeSnapshotAssetReferences(snapshot)

    expect(sanitized.floorTileAssetIds).toEqual({})
    expect(sanitized.wallSurfaceAssetIds).toEqual({})
  })

  it('remaps removed lit torch assets to the toggleable torch with lit props', () => {
    const snapshot = createSnapshot()
    snapshot.selectedAssetIds.prop = 'dungeon.props_torch_lit'
    snapshot.placedObjects = {
      torch1: {
        id: 'torch1',
        type: 'prop',
        assetId: 'dungeon.props_torch_lit',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        props: {},
        cell: [0, 0],
        cellKey: '0:0:floor',
        layerId: 'default',
      },
    }

    const sanitized = sanitizeSnapshotAssetReferences(snapshot)

    expect(sanitized.selectedAssetIds.prop).toBe('dungeon.props_torch')
    expect(sanitized.placedObjects['torch1']?.assetId).toBe('dungeon.props_torch')
    expect(sanitized.placedObjects['torch1']?.props.lit).toBe(true)
  })

  it('remaps removed lit candle assets to the toggleable candle props with lit props', () => {
    const snapshot = createSnapshot()
    snapshot.selectedAssetIds.prop = 'dungeon.props_candle_lit'
    snapshot.placedObjects = {
      candle1: {
        id: 'candle1',
        type: 'prop',
        assetId: 'dungeon.props_candle_lit',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        props: {},
        cell: [0, 0],
        cellKey: '0:0:floor',
        layerId: 'default',
      },
      candleThin1: {
        id: 'candleThin1',
        type: 'prop',
        assetId: 'dungeon.props_candle_thin_lit',
        position: [1, 0, 0],
        rotation: [0, 0, 0],
        props: {},
        cell: [1, 0],
        cellKey: '1:0:floor',
        layerId: 'default',
      },
    }

    const sanitized = sanitizeSnapshotAssetReferences(snapshot)

    expect(sanitized.selectedAssetIds.prop).toBe('dungeon.props_candle')
    expect(sanitized.placedObjects['candle1']?.assetId).toBe('dungeon.props_candle')
    expect(sanitized.placedObjects['candle1']?.props.lit).toBe(true)
    expect(sanitized.placedObjects['candleThin1']?.assetId).toBe('dungeon.props_candle_thin')
    expect(sanitized.placedObjects['candleThin1']?.props.lit).toBe(true)
  })

  it('sanitizes floor snapshots in persisted state', () => {
    const sanitized = sanitizePersistedAssetReferences({
      ...createSnapshot(),
      floors: {
        'floor-1': {
          id: 'floor-1',
          name: 'Ground Floor',
          level: 0,
          snapshot: createSnapshot(),
          history: [],
          future: [],
        },
      },
    })

    expect(sanitized.selectedAssetIds?.floor).toBe(getDefaultAssetIdByCategory('floor'))
    expect(sanitized.floors?.['floor-1'].snapshot.selectedAssetIds.wall).toBe(
      getDefaultAssetIdByCategory('wall'),
    )
    expect(sanitized.floors?.['floor-1'].snapshot.rooms.room1.floorAssetId).toBeNull()
  })
})
