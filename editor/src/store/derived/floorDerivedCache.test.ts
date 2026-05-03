import { beforeEach, describe, expect, it } from 'vitest'
import { createFloorDirtyInfo } from '../floorDirtyDomains'
import type { DungeonRoomData } from './floorDerived'
import {
  clearFloorDerivedCache,
  getOrBuildCachedFloorDerivedBundle,
  getOrBuildCachedFloorSceneDerivedBundle,
} from './floorDerivedCache'

describe('floorDerivedCache', () => {
  beforeEach(() => {
    clearFloorDerivedCache()
  })

  it('reuses unaffected derived slices across unrelated dirty-domain changes', () => {
    const data = createFloorData()
    const baseDirtyInfo = createFloorDirtyInfo()
    const derivedA = getOrBuildCachedFloorDerivedBundle({
      data,
      dirtyInfo: baseDirtyInfo,
    })
    const derivedB = getOrBuildCachedFloorDerivedBundle({
      data,
      dirtyInfo: {
        ...baseDirtyInfo,
        sequence: 1,
        lightingVersion: 1,
        affectedObjectIds: ['torch'],
      },
    })

    expect(derivedB.visiblePaintedCells).toBe(derivedA.visiblePaintedCells)
    expect(derivedB.visiblePaintedCellRecords).toBe(derivedA.visiblePaintedCellRecords)
    expect(derivedB.visibleObjects).toBe(derivedA.visibleObjects)
    expect(derivedB.visibleOpenings).toBe(derivedA.visibleOpenings)
    expect(derivedB.topLevelObjects).toBe(derivedA.topLevelObjects)
    expect(derivedB.childrenByParent).toBe(derivedA.childrenByParent)
    expect(derivedB.wallOpeningDerivedState).toBe(derivedA.wallOpeningDerivedState)
    expect(derivedB.bakedLightBuildInput).not.toBe(derivedA.bakedLightBuildInput)
  })

  it('reuses snapshot-derived bundles when overview inputs keep the same identities', () => {
    const data = createFloorData()
    const derivedA = getOrBuildCachedFloorDerivedBundle({
      data,
      dirtyInfo: null,
    })
    const derivedB = getOrBuildCachedFloorDerivedBundle({
      data: {
        ...data,
      },
      dirtyInfo: null,
    })

    expect(derivedB).toBe(derivedA)
    expect(derivedB.data).toBe(derivedA.data)
    expect(derivedB.visiblePaintedCells).toBe(derivedA.visiblePaintedCells)
    expect(derivedB.visibleObjects).toBe(derivedA.visibleObjects)
    expect(derivedB.bakedLightBuildInput).toBe(derivedA.bakedLightBuildInput)
  })

  it('reuses cached scene bundles and omits render-only tile slices', () => {
    const data = createFloorData()
    const derivedA = getOrBuildCachedFloorSceneDerivedBundle({
      data,
      dirtyInfo: null,
    })
    const derivedB = getOrBuildCachedFloorSceneDerivedBundle({
      data: {
        ...data,
      },
      dirtyInfo: null,
    })

    expect(derivedB).toBe(derivedA)
    expect(derivedB.data).toBe(derivedA.data)
    expect(derivedB.topLevelObjects).toBe(derivedA.topLevelObjects)
    expect(derivedB.childrenByParent).toBe(derivedA.childrenByParent)
    expect(derivedB.bakedLightBuildInput).toBe(derivedA.bakedLightBuildInput)
    expect('visiblePaintedCellRecords' in derivedB).toBe(false)
    expect('visibleOpenings' in derivedB).toBe(false)
  })
})

function createFloorData(): DungeonRoomData {
  return {
    floorId: 'floor-cache',
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
}
