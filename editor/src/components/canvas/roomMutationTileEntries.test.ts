import { describe, expect, it } from 'vitest'
import { upsertSplineWallGraphRoomPath } from '../../store/splineWallGraph'
import {
  buildRemovedRoomTileEntries,
  buildTransientRoomEntrySignature,
  expandRoomMutationCells,
  getCellsForWallKeys,
  type RoomAnimationStateInput,
} from './roomMutationTileEntries'

describe('roomMutationTileEntries', () => {
  it('expands affected cells to include orthogonal neighbors', () => {
    expect(expandRoomMutationCells([[4, 7]])).toEqual(
      expect.arrayContaining([
        [4, 7],
        [3, 7],
        [5, 7],
        [4, 6],
        [4, 8],
      ]),
    )
  })

  it('collects cells from both sides of wall keys for every direction', () => {
    expect(getCellsForWallKeys(['4:7:east'])).toEqual(
      expect.arrayContaining([
        [4, 7],
        [5, 7],
      ]),
    )
    expect(getCellsForWallKeys(['4:7:west'])).toEqual(
      expect.arrayContaining([
        [4, 7],
        [3, 7],
      ]),
    )
    expect(getCellsForWallKeys(['4:7:north'])).toEqual(
      expect.arrayContaining([
        [4, 7],
        [4, 8],
      ]),
    )
    expect(getCellsForWallKeys(['4:7:south'])).toEqual(
      expect.arrayContaining([
        [4, 7],
        [4, 6],
      ]),
    )
  })

  it('distinguishes corner ghosts that reuse a vertex with different supporting walls', () => {
    expect(buildTransientRoomEntrySignature({
      key: '1:1:corner',
      assetId: 'dungeon.props_pillars_pillar',
      position: [2, 0, 2],
      rotation: [0, 0, 0],
      variant: 'prop',
      variantKey: '1:1:corner',
      visibility: 'visible',
      objectProps: {
        __transientCornerWallKeys: '0:0:north|0:0:east',
      },
    })).not.toBe(buildTransientRoomEntrySignature({
      key: '1:1:corner',
      assetId: 'dungeon.props_pillars_pillar',
      position: [2, 0, 2],
      rotation: [0, 0, 0],
      variant: 'prop',
      variantKey: '1:1:corner',
      visibility: 'visible',
      objectProps: {
        __transientCornerWallKeys: '0:0:north|1:0:west',
      },
    }))
  })

  it('preserves graph-backed floor coverage when diffing room mutations', () => {
    const splineWallGraph = upsertSplineWallGraphRoomPath({ nodes: {}, segments: {}, paths: {} }, {
      roomId: 'room-graph',
      layerId: 'layer-1',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [3, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [3, 1], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 1], cornerMode: 'square', cornerAmount: 0 },
      ],
    })
    const baseState: RoomAnimationStateInput = {
      activeLayerId: 'layer-1',
      activeRoomSetId: 'dungeon',
      bakedLightField: null,
      floorTileAssetIds: {},
      globalFloorAssetId: 'dungeon.floor_floor_tile_small',
      globalWallAssetId: 'dungeon.wall_wall',
      innerWalls: {},
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'layer-1', roomId: 'room-graph' },
        '1:0': { cell: [1, 0], layerId: 'layer-1', roomId: 'room-graph' },
      },
      rooms: {
        'room-graph': {
          id: 'room-graph',
          name: 'Graph Room',
          layerId: 'layer-1',
          roomSetId: 'dungeon',
          floorAssetId: null,
          wallAssetId: null,
        },
      },
      splineWallGraph,
      wallOpenings: {},
      wallSurfaceAssetIds: {},
      wallSurfaceProps: {},
    }

    const removalEntries = buildRemovedRoomTileEntries({
      before: baseState,
      after: {
        ...baseState,
        paintedCells: {
          ...baseState.paintedCells,
          '2:1': { cell: [2, 1], layerId: 'layer-1', roomId: 'room-new' },
        },
        rooms: {
          ...baseState.rooms,
          'room-new': {
            id: 'room-new',
            name: 'New Room',
            layerId: 'layer-1',
            roomSetId: 'dungeon',
            floorAssetId: null,
            wallAssetId: null,
          },
        },
      },
      buildStartedAt: 1000,
      cells: expandRoomMutationCells([[2, 1]]),
      originCell: [2, 1],
    })

    expect(removalEntries.some((entry) => entry.key === 'floor:2:0')).toBe(false)
  })

})
