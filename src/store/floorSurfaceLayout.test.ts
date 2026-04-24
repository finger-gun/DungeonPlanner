import { describe, expect, it } from 'vitest'
import type { PaintedCells } from './useDungeonStore'
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
