import { describe, expect, it } from 'vitest'
import { prepareFloorLightComputePrototype } from '../rendering/gpu'
import { packFloorWallTileMirrorPrototype } from '../rendering/gpu/FloorWallTileMirrorPrototype'
import type { ResolvedDungeonLightSource } from '../rendering/dungeonLightField'
import { PERF_BUDGETS } from './budgets'

describe('compute perf benchmarks', () => {
  it('keeps local compute prototype dispatches inside the bounded cell budget', () => {
    const prepared = prepareFloorLightComputePrototype({
      floorId: 'floor-compute-budget',
      floorCells: [[0, 0], [1, 0], [16, 0], [17, 0]],
      staticLightSources: [
        createResolvedLightSource('near', [1, 1.5, 1]),
        createResolvedLightSource('far', [33, 1.5, 1]),
      ],
      dirtyHint: {
        sequence: 1,
        dirtyCellRect: {
          minCellX: 0,
          maxCellX: 1,
          minCellZ: 0,
          maxCellZ: 0,
        },
        dirtyCellKeys: ['0:0', '1:0'],
        dirtyChunkKeys: ['0:0'],
        dirtyLightChunkKeys: ['0:0'],
        dirtyWallKeys: [],
        affectedObjectIds: ['near'],
        fullRefresh: false,
      },
      occlusionInput: {
        paintedCells: {
          '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
          '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-a' },
          '16:0': { cell: [16, 0], layerId: 'default', roomId: 'room-b' },
          '17:0': { cell: [17, 0], layerId: 'default', roomId: 'room-b' },
        },
        wallOpenings: {},
        innerWalls: {},
      },
    })

    expect(prepared).not.toBeNull()
    expect(prepared!.packed.cellCount).toBeLessThanOrEqual(PERF_BUDGETS.maxLocalComputeCells)
  })

  it('keeps local tile and wall mirrors inside the nearby chunk budget', () => {
    const packed = packFloorWallTileMirrorPrototype({
      floorId: 'floor-mirror-budget',
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
        '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-a' },
        '16:0': { cell: [16, 0], layerId: 'default', roomId: 'room-b' },
      },
      wallOpenings: {
        opening: { id: 'opening', wallKey: '0:0:north', width: 1, flipped: false, layerId: 'default', assetId: null },
      },
      innerWalls: {
        '1:0:east': { wallKey: '1:0:east', layerId: 'default' },
      },
      dirtyHint: {
        dirtyCellRect: {
          minCellX: 0,
          maxCellX: 1,
          minCellZ: 0,
          maxCellZ: 0,
        },
        dirtyWallKeys: ['1:0:east'],
        fullRefresh: false,
      },
    })

    expect(packed.dirtyChunkKeys.length).toBeLessThanOrEqual(PERF_BUDGETS.maxLocalMirrorChunks)
    expect(packed.tileCellKeys.length).toBeLessThanOrEqual(PERF_BUDGETS.maxLocalMirrorTiles)
  })
})

function createResolvedLightSource(
  id: string,
  position: [number, number, number],
): ResolvedDungeonLightSource {
  return {
    key: id,
    object: {
      id,
      type: 'prop',
      assetId: 'dungeon.props_torch',
      position,
      rotation: [0, 0, 0],
      props: {},
      cell: [0, 0],
      cellKey: '0:0:floor',
      layerId: 'default',
    },
    light: {
      color: '#ff9944',
      intensity: 1.5,
      distance: 8,
      decay: 2,
    },
    position,
    linearColor: [1, 0.5583403896342679, 0.05780543019106723],
  }
}
