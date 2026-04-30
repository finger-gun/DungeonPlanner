import { describe, expect, it } from 'vitest'
import { buildFloorDerivedBundle, type DungeonRoomData } from './floorDerived'

describe('buildFloorDerivedBundle', () => {
  it('builds shared visible floor, object, and baked-light inputs once', () => {
    const data: DungeonRoomData = {
      floorId: 'floor-1',
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'visible', roomId: 'room-a' },
        '1:0': { cell: [1, 0], layerId: 'hidden', roomId: 'room-a' },
      },
      layers: {
        visible: { id: 'visible', name: 'Visible', visible: true, locked: false },
        hidden: { id: 'hidden', name: 'Hidden', visible: false, locked: false },
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
      wallOpenings: {
        door: {
          id: 'door',
          assetId: null,
          wallKey: '0:0:east',
          width: 1,
          layerId: 'visible',
        },
        hiddenDoor: {
          id: 'hidden-door',
          assetId: null,
          wallKey: '1:0:east',
          width: 1,
          layerId: 'hidden',
        },
      },
      innerWalls: {},
      placedObjects: {
        parent: {
          id: 'parent',
          type: 'prop',
          assetId: 'dungeon.props_torch',
          position: [1, 0, 1],
          rotation: [0, 0, 0],
          props: {},
          cell: [0, 0],
          cellKey: '0:0:floor',
          layerId: 'visible',
        },
        child: {
          id: 'child',
          type: 'prop',
          assetId: 'dungeon.props_torch',
          position: [1, 0, 1],
          rotation: [0, 0, 0],
          parentObjectId: 'parent',
          props: {},
          cell: [0, 0],
          cellKey: '0:0:floor',
          layerId: 'visible',
        },
        hidden: {
          id: 'hidden',
          type: 'prop',
          assetId: 'dungeon.props_torch',
          position: [3, 0, 1],
          rotation: [0, 0, 0],
          props: {},
          cell: [1, 0],
          cellKey: '1:0:floor',
          layerId: 'hidden',
        },
      },
      floorTileAssetIds: {},
      wallSurfaceAssetIds: {},
      wallSurfaceProps: {},
      globalFloorAssetId: null,
      globalWallAssetId: null,
    }

    const derived = buildFloorDerivedBundle(data)

    expect(Object.keys(derived.visiblePaintedCellRecords)).toEqual(['0:0'])
    expect(derived.visiblePaintedCells).toEqual([[0, 0]])
    expect(derived.visibleObjects.map((object) => object.id)).toEqual(['parent', 'child'])
    expect(derived.visibleOpenings.map((opening) => opening.id)).toEqual(['door'])
    expect(derived.topLevelObjects.map((object) => object.id)).toEqual(['parent'])
    expect(derived.childrenByParent.parent?.map((object) => object.id)).toEqual(['child'])
    expect(derived.staticLightSources.map((lightSource) => lightSource.key)).toEqual(['parent', 'child'])
    expect(derived.bakedLightBuildInput.floorId).toBe('floor-1')
    expect(derived.bakedLightBuildInput.floorCells).toEqual([[0, 0]])
    expect(derived.bakedLightBuildInput.occlusionInput?.paintedCells).toBe(derived.visiblePaintedCellRecords)
    expect(derived.wallOpeningDerivedState.suppressedWallKeys.has('0:0:east')).toBe(true)
    expect(derived.wallOpeningDerivedState.suppressedWallKeys.has('1:0:west')).toBe(true)
  })
})
