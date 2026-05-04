import { describe, expect, it } from 'vitest'
import { createFloorDirtyInfo } from '../../store/floorDirtyDomains'
import { buildFloorDerivedBundle, type DungeonRoomData } from '../../store/derived/floorDerived'
import {
  buildChunkedFloorRenderDerivedCache,
  buildFloorRenderDerivedBundle,
  getChunkKeysForDirtyRect,
} from './floorRenderDerived'

describe('buildFloorRenderDerivedBundle', () => {
  it('uses uniform pillar assets for room corners', () => {
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

    const bundle = buildFloorRenderDerivedBundle(derived, {
      includeFloorReceivers: false,
    })

    expect(bundle.corners).toHaveLength(4)
    expect(bundle.corners.every((corner) => corner.assetId === 'dungeon.props_pillars_pillar')).toBe(true)
    expect(bundle.corners.every((corner) => corner.rotation[0] === 0 && corner.rotation[1] === 0 && corner.rotation[2] === 0)).toBe(true)
  })

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

  it('rebuilds only affected chunks when a dirty rect stays local', () => {
    const data = createChunkedRoomData()
    const initialCache = buildChunkedFloorRenderDerivedCache({
      previous: null,
      floorId: data.floorId,
      input: {
        paintedCells: data.paintedCells,
        layers: data.layers,
        rooms: data.rooms,
        wallOpenings: data.wallOpenings,
        globalFloorAssetId: data.globalFloorAssetId,
        floorTileAssetIds: data.floorTileAssetIds,
        globalWallAssetId: data.globalWallAssetId,
        wallSurfaceAssetIds: data.wallSurfaceAssetIds,
        wallSurfaceProps: data.wallSurfaceProps,
        innerWalls: data.innerWalls,
      },
      dirtyInfo: null,
      includeFloorReceivers: false,
      haloCells: 1,
    })

    const nextData = {
      ...createChunkedRoomData(),
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'visible', roomId: 'room-a' },
        '1:0': { cell: [1, 0], layerId: 'visible', roomId: 'room-a' },
        '9:0': { cell: [9, 0], layerId: 'visible', roomId: 'room-a' },
      },
    } satisfies DungeonRoomData
    const dirtyInfo = {
      ...createFloorDirtyInfo(),
      sequence: 1,
      tilesVersion: 1,
      renderPlanVersion: 1,
      dirtyCellRect: {
        minCellX: 1,
        maxCellX: 1,
        minCellZ: 0,
        maxCellZ: 0,
      },
    }

    const nextCache = buildChunkedFloorRenderDerivedCache({
      previous: initialCache,
      floorId: nextData.floorId,
      input: {
        paintedCells: nextData.paintedCells,
        layers: nextData.layers,
        rooms: nextData.rooms,
        wallOpenings: nextData.wallOpenings,
        globalFloorAssetId: nextData.globalFloorAssetId,
        floorTileAssetIds: nextData.floorTileAssetIds,
        globalWallAssetId: nextData.globalWallAssetId,
        wallSurfaceAssetIds: nextData.wallSurfaceAssetIds,
        wallSurfaceProps: nextData.wallSurfaceProps,
        innerWalls: nextData.innerWalls,
      },
      dirtyInfo,
      includeFloorReceivers: false,
      haloCells: 1,
    })

    expect(nextCache.bundlesByChunk.get('0:0')).not.toBe(initialCache.bundlesByChunk.get('0:0'))
    expect(nextCache.bundlesByChunk.get('1:0')).toBe(initialCache.bundlesByChunk.get('1:0'))
  })

  it('expands dirty chunk invalidation by one halo cell', () => {
    expect(getChunkKeysForDirtyRect({
      minCellX: 8,
      maxCellX: 8,
      minCellZ: 0,
      maxCellZ: 0,
    }, 1)).toEqual(['0:-1', '1:-1', '0:0', '1:0'])
  })

  it('keeps openings scoped to their owning chunk while preserving halo context', () => {
    const data = createChunkedRoomData()
    data.wallOpenings = {
      'opening-a': {
        id: 'opening-a',
        wallKey: '0:0:N',
        assetId: 'dungeon.door_single',
        width: 1,
        layerId: 'visible',
      },
      'opening-b': {
        id: 'opening-b',
        wallKey: '9:0:N',
        assetId: 'dungeon.door_single',
        width: 1,
        layerId: 'visible',
      },
    }

    const cache = buildChunkedFloorRenderDerivedCache({
      previous: null,
      floorId: data.floorId,
      input: {
        paintedCells: data.paintedCells,
        layers: data.layers,
        rooms: data.rooms,
        wallOpenings: data.wallOpenings,
        globalFloorAssetId: data.globalFloorAssetId,
        floorTileAssetIds: data.floorTileAssetIds,
        globalWallAssetId: data.globalWallAssetId,
        wallSurfaceAssetIds: data.wallSurfaceAssetIds,
        wallSurfaceProps: data.wallSurfaceProps,
        innerWalls: data.innerWalls,
      },
      dirtyInfo: null,
      includeFloorReceivers: false,
      haloCells: 1,
    })

    expect(cache.bundlesByChunk.get('0:0')?.openings.map((opening) => opening.id)).toEqual(['opening-a'])
    expect(cache.bundlesByChunk.get('1:0')?.openings.map((opening) => opening.id)).toEqual(['opening-b'])
    expect(Object.keys(cache.bundlesByChunk.get('0:0')?.contextPaintedCells ?? {})).toContain('0:0')
  })
})

function createChunkedRoomData(): DungeonRoomData {
  return {
    floorId: 'floor-1',
    paintedCells: {
      '0:0': { cell: [0, 0], layerId: 'visible', roomId: 'room-a' },
      '9:0': { cell: [9, 0], layerId: 'visible', roomId: 'room-a' },
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
  }
}
