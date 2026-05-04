import { describe, expect, it } from 'vitest'
import { packFloorWallTileMirrorPrototype } from './FloorWallTileMirrorPrototype'

describe('FloorWallTileMirrorPrototype', () => {
  it('bounds mirrored tiles and wall modifiers to the local dirty region', () => {
    const packed = packFloorWallTileMirrorPrototype({
      floorId: 'floor-1',
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
        '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-a' },
        '20:20': { cell: [20, 20], layerId: 'default', roomId: 'room-b' },
      },
      wallOpenings: {
        openNear: { id: 'openNear', wallKey: '0:0:north', width: 1, flipped: false, layerId: 'default', assetId: null },
        openFar: { id: 'openFar', wallKey: '20:20:north', width: 2, flipped: false, layerId: 'default', assetId: null },
      },
      innerWalls: {
        '1:0:east': { wallKey: '1:0:east', layerId: 'default' },
        '20:20:east': { wallKey: '20:20:east', layerId: 'default' },
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

    expect(packed.tileCellKeys).toEqual(['0:0', '1:0'])
    expect(packed.openingWallKeys).toEqual(['0:0:north'])
    expect(packed.innerWallKeys).toEqual(['1:0:east'])
    expect(packed.dirtyChunkKeys).toEqual(['0:0'])
  })
})
