import { describe, expect, it } from 'vitest'
import { buildFloorDerivedBundle, type DungeonRoomData } from '../../store/derived/floorDerived'
import { buildFloorRenderDerivedBundle } from './floorRenderDerived'

describe('buildFloorRenderDerivedBundle', () => {
  it('skips floor receiver planning when edit-mode receiver work is disabled', () => {
    const derived = buildFloorDerivedBundle({
      floorId: 'floor-1',
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'visible', roomId: 'room-a' },
      },
      layers: {
        visible: { id: 'visible', name: 'Visible', visible: true, locked: false },
      },
      rooms: {
        'room-a': {
          id: 'room-a',
          name: 'Room A',
          layerId: 'visible',
          floorAssetId: null,
          wallAssetId: null,
        },
      },
      wallOpenings: {},
      innerWalls: {},
      placedObjects: {},
      floorTileAssetIds: {},
      wallSurfaceAssetIds: {},
      wallSurfaceProps: {},
      globalFloorAssetId: 'dungeon.floor_floor_tile_small',
      globalWallAssetId: 'dungeon.wall_wall',
    } satisfies DungeonRoomData)

    const withReceivers = buildFloorRenderDerivedBundle(derived)
    const withoutReceivers = buildFloorRenderDerivedBundle(derived, {
      includeFloorReceivers: false,
    })

    expect(withReceivers.visibleFloorReceiverCells.length).toBeGreaterThan(0)
    expect(withoutReceivers.visibleFloorReceiverCells).toEqual([])
  })
})
