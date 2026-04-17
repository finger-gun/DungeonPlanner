import { describe, expect, it } from 'vitest'
import { getDefaultAssetIdByCategory } from '../content-packs/registry'
import {
  sanitizePersistedAssetReferences,
  sanitizeSelectedAssetIds,
  sanitizeSnapshotAssetReferences,
} from './assetReferences'

function createSnapshot() {
  return {
    tool: 'move' as const,
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
    exploredCells: {},
    floorTileAssetIds: {},
    wallSurfaceAssetIds: {},
    placedObjects: {},
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
    const snapshot = createSnapshot()
    snapshot.wallOpenings.opening1 = {
      ...snapshot.wallOpenings.opening1,
      assetId: 'kaykit.opening_wall_doorway',
      width: 2,
    }

    const sanitized = sanitizeSnapshotAssetReferences(snapshot)

    expect(sanitized.wallOpenings.opening1.assetId).toBe('kaykit.opening_wall_doorway')
    expect(sanitized.wallOpenings.opening1.width).toBe(1)
  })

  it('drops invalid floor and wall surface overrides', () => {
    const snapshot = createSnapshot()
    ;(snapshot.floorTileAssetIds as Record<string, string>)['0:0'] = 'missing.floor'
    ;(snapshot.wallSurfaceAssetIds as Record<string, string>)['0:0:north'] = 'missing.wall'

    const sanitized = sanitizeSnapshotAssetReferences(snapshot)

    expect(sanitized.floorTileAssetIds).toEqual({})
    expect(sanitized.wallSurfaceAssetIds).toEqual({})
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

    expect(sanitized.selectedAssetIds.floor).toBe(getDefaultAssetIdByCategory('floor'))
    expect(sanitized.floors?.['floor-1'].snapshot.selectedAssetIds.wall).toBe(
      getDefaultAssetIdByCategory('wall'),
    )
    expect(sanitized.floors?.['floor-1'].snapshot.rooms.room1.floorAssetId).toBeNull()
  })
})
