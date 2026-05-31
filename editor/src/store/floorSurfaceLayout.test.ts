import { describe, expect, it } from 'vitest'
import type { PaintedCells } from './useDungeonStore'
import { upsertSplineWallGraphRoomPath } from './splineWallGraph'
import {
  buildFloorRenderPlan,
  createFloorSurfacePlacement,
  findFloorSurfaceAnchorAtCell,
  isFloorSurfacePlacementValid,
  resolveEffectiveFloorAssetIdForCellKey,
} from './floorSurfaceLayout'

describe('floorSurfaceLayout', () => {
  it('builds one anchored surface placement for a multi-tile floor override', () => {
    const paintedCells = createPaintedCells([
      [0, 0], [1, 0], [0, 1], [1, 1], [2, 0],
    ])

    const plan = buildFloorRenderPlan(
      paintedCells,
      {},
      'dungeon.floor_floor_tile_small',
      { '0:0': 'dungeon.floor_floor_tile_large' },
    )

    expect(plan.surfacePlacements).toHaveLength(1)
    expect(plan.surfacePlacements[0]).toMatchObject({
      anchorCellKey: '0:0',
      coveredCellKeys: ['0:0', '1:0', '0:1', '1:1'],
      position: [2, 0, 2],
    })
    expect(plan.baseGroups.flatMap((group) => group.cells)).toEqual([[2, 0]])
  })

  it('resolves covered cells back to the owning anchor asset', () => {
    const paintedCells = createPaintedCells([
      [0, 0], [1, 0], [0, 1], [1, 1],
    ])

    expect(findFloorSurfaceAnchorAtCell('1:1', paintedCells, {
      '0:0': 'dungeon.floor_floor_tile_large',
    })).toBe('0:0')
    expect(resolveEffectiveFloorAssetIdForCellKey(
      '1:1',
      paintedCells,
      {},
      'dungeon.floor_floor_tile_small',
      { '0:0': 'dungeon.floor_floor_tile_large' },
    )).toBe('dungeon.floor_floor_tile_large')
  })

  it('rejects multi-tile placements that do not fully fit painted cells', () => {
    const paintedCells = createPaintedCells([
      [0, 0], [1, 0], [0, 1],
    ])

    expect(isFloorSurfacePlacementValid('0:0', 'dungeon.floor_floor_tile_large', paintedCells)).toBe(false)
    expect(createFloorSurfacePlacement('0:0', 'dungeon.floor_floor_tile_grate')?.coveredCellKeys).toEqual(['0:0', '1:0'])
  })

  it('resolves cave room floors deterministically with the room-set floor texture', () => {
    const paintedCells = createPaintedCells([
      [0, 0], [1, 0], [0, 1], [1, 1],
    ])
    Object.values(paintedCells).forEach((record) => {
      record.roomId = 'room-cave'
    })

    const rooms = {
      'room-cave': {
        id: 'room-cave',
        name: 'Cave Room',
        layerId: 'layer-1',
        roomSetId: 'cave',
        floorAssetId: null,
        wallAssetId: null,
      },
    }

    const firstPlan = buildFloorRenderPlan(
      paintedCells,
      rooms,
      'dungeon.floor_floor_tile_small',
      {},
    )
    const secondPlan = buildFloorRenderPlan(
      paintedCells,
      rooms,
      'dungeon.floor_floor_tile_small',
      {},
    )

    expect(firstPlan.effectiveAssetIdsByCellKey).toEqual(secondPlan.effectiveAssetIdsByCellKey)
    expect(firstPlan.effectiveRotationsByCellKey).toEqual(secondPlan.effectiveRotationsByCellKey)
    Object.values(firstPlan.effectiveAssetIdsByCellKey).forEach((assetId) => {
      expect(assetId).toBe('dungeon.floor_ancient-catacomb')
    })
    Object.values(firstPlan.effectiveRotationsByCellKey).forEach((rotation) => {
      expect(rotation).toEqual([0, 0, 0])
    })
  })

  it('keeps painted room floor groups scoped to their owning room for floor masks', () => {
    const paintedCells = createPaintedCells([
      [0, 0], [1, 0], [0, 1], [1, 1],
    ])
    Object.values(paintedCells).forEach((record) => {
      record.roomId = 'room-painted'
    })

    const plan = buildFloorRenderPlan(
      paintedCells,
      {
        'room-painted': {
          id: 'room-painted',
          name: 'Painted Room',
          layerId: 'layer-1',
          roomSetId: 'dungeon',
          floorAssetId: null,
          wallAssetId: null,
          geometrySource: 'paint',
        },
      },
      'dungeon.floor_floor_tile_small',
      {},
    )

    expect(plan.baseGroups).toHaveLength(1)
    expect(plan.baseGroups[0]).toMatchObject({
      roomId: 'room-painted',
      cells: [[0, 0], [1, 0], [0, 1], [1, 1]],
    })
  })

  it('keeps cave room texture floors deterministic without synthetic tile variation', () => {
    const paintedCells = createPaintedCells(
      Array.from({ length: 6 }, (_, z) =>
        Array.from({ length: 6 }, (_, x) => [x, z] as [number, number]),
      ).flat(),
    )
    Object.values(paintedCells).forEach((record) => {
      record.roomId = 'room-cave'
    })

    const rooms = {
      'room-cave': {
        id: 'room-cave',
        name: 'Cave Room',
        layerId: 'layer-1',
        roomSetId: 'cave',
        floorAssetId: null,
        wallAssetId: null,
      },
    }

    const plan = buildFloorRenderPlan(
      paintedCells,
      rooms,
      'dungeon.floor_floor_tile_small',
      {},
    )

    const signatures = Object.keys(plan.effectiveAssetIdsByCellKey).map((cellKey) =>
      `${plan.effectiveAssetIdsByCellKey[cellKey]}@${plan.effectiveRotationsByCellKey[cellKey]?.[1]}`,
    )
    const diagonalSignatures = Array.from({ length: 6 }, (_, index) =>
      `${plan.effectiveAssetIdsByCellKey[`${index}:${index}`]}@${plan.effectiveRotationsByCellKey[`${index}:${index}`]?.[1]}`,
    )

    expect(new Set(signatures)).toEqual(new Set(['dungeon.floor_ancient-catacomb@0']))
    expect(new Set(diagonalSignatures)).toEqual(new Set(['dungeon.floor_ancient-catacomb@0']))
  })

  it('plans graph-backed room floors from spline-covered cells beyond painted ownership', () => {
    const paintedCells = createPaintedCells([
      [3, 0], [4, 0],
      [3, 1], [4, 1],
      [3, 2], [4, 2],
    ])
    Object.values(paintedCells).forEach((record) => {
      record.roomId = 'room-graph'
    })

    const plan = buildFloorRenderPlan(
      paintedCells,
      {
        'room-graph': {
          id: 'room-graph',
          name: 'Graph Room',
          layerId: 'layer-1',
          roomSetId: 'dungeon',
          floorAssetId: null,
          wallAssetId: null,
        },
      },
      'dungeon.floor_floor_tile_small',
      {},
      upsertSplineWallGraphRoomPath({ nodes: {}, segments: {}, paths: {} }, {
        roomId: 'room-graph',
        layerId: 'layer-1',
        nodes: [
          { position: [2, 0], cornerMode: 'square', cornerAmount: 0 },
          { position: [5, 0], cornerMode: 'square', cornerAmount: 0 },
          { position: [5, 3], cornerMode: 'square', cornerAmount: 0 },
          { position: [2, 3], cornerMode: 'square', cornerAmount: 0 },
        ],
      }),
    )

    expect(plan.baseGroups).toContainEqual(expect.objectContaining({
      roomId: 'room-graph',
      cells: expect.arrayContaining([
        [2, 0], [3, 0], [4, 0],
        [2, 1], [3, 1], [4, 1],
        [2, 2], [3, 2], [4, 2],
      ]),
    }))
  })
})

function createPaintedCells(cells: Array<[number, number]>): PaintedCells {
  return Object.fromEntries(
    cells.map(([x, z]) => {
      const key = `${x}:${z}`
      return [key, {
        cell: [x, z] as [number, number],
        layerId: 'layer-1',
        roomId: null,
      }]
    }),
  ) as PaintedCells
}
