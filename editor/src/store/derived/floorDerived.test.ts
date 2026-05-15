import { describe, expect, it } from 'vitest'
import {
  buildBakedLightBuildInput,
  buildFloorDerivedBundle,
  buildObjectHierarchy,
  buildStaticLightSources,
  buildVisibleObjects,
  buildVisibleOpenings,
  buildVisiblePaintedCells,
  type DungeonRoomData,
} from './floorDerived'
import { createFloorDirtyInfo } from '../floorDirtyDomains'

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

  it('exposes split helpers that preserve the same derived slices', () => {
    const data: DungeonRoomData = {
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
      placedObjects: {
        torch: {
          id: 'torch',
          type: 'prop',
          assetId: 'dungeon.props_torch',
          position: [1, 0, 1],
          rotation: [0, 0, 0],
          props: {},
          cell: [0, 0],
          cellKey: '0:0:floor',
          layerId: 'visible',
        },
      },
      floorTileAssetIds: {},
      wallSurfaceAssetIds: {},
      wallSurfaceProps: {},
      globalFloorAssetId: null,
      globalWallAssetId: null,
    }

    const visiblePainted = buildVisiblePaintedCells(data)
    const visibleObjects = buildVisibleObjects(data)
    const visibleOpenings = buildVisibleOpenings(data)
    const staticLightSources = buildStaticLightSources(visibleObjects)
    const objectHierarchy = buildObjectHierarchy(visibleObjects)
    const bakedLightBuildInput = buildBakedLightBuildInput(
      data,
      visiblePainted.visiblePaintedCells,
      visiblePainted.visiblePaintedCellRecords,
      staticLightSources,
      createFloorDirtyInfo(),
    )

    expect(visiblePainted.visiblePaintedCells).toEqual([[0, 0]])
    expect(Object.keys(visiblePainted.visiblePaintedCellRecords)).toEqual(['0:0'])
    expect(visibleObjects.map((object) => object.id)).toEqual(['torch'])
    expect(visibleOpenings).toEqual([])
    expect(staticLightSources.map((lightSource) => lightSource.key)).toEqual(['torch'])
    expect(objectHierarchy.topLevelObjects.map((object) => object.id)).toEqual(['torch'])
    expect(bakedLightBuildInput.occlusionInput?.paintedCells).toBe(visiblePainted.visiblePaintedCellRecords)
    expect(bakedLightBuildInput.dirtyHint?.sequence).toBe(0)
  })
})
