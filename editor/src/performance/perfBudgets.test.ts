import { beforeEach, describe, expect, it } from 'vitest'
import type { GeneratedCharacterRecord } from '../generated-characters/types'
import {
  clearBakedFloorLightFieldCache,
  getOrBuildBakedFloorLightField,
  prepareBakedFloorLightFieldBuild,
  prepareBakedFloorLightFieldWorkerBuild,
  type ResolvedDungeonLightSource,
} from '../rendering/dungeonLightField'
import { PERF_BUDGETS } from './budgets'
import { createFloorDirtyInfo } from '../store/floorDirtyDomains'
import type { DungeonRoomData } from '../store/derived/floorDerived'
import {
  clearFloorDerivedCache,
  getOrBuildCachedFloorDerivedBundle,
} from '../store/derived/floorDerivedCache'
import {
  clearPlayVisibilityDerivedCache,
  getOrBuildPlayVisibilityDerivedState,
} from '../components/canvas/playVisibility'

describe('performance budgets', () => {
  beforeEach(() => {
    clearBakedFloorLightFieldCache()
    clearFloorDerivedCache()
    clearPlayVisibilityDerivedCache()
  })

  it('keeps local baked-light worker payloads inside the dirty-chunk budget', () => {
    const localProbeLight = {
      color: '#ff9944',
      intensity: 1.5,
      distance: 1.5,
      decay: 2,
    }

    getOrBuildBakedFloorLightField({
      floorId: 'floor-budget',
      floorCells: [[0, 0], [1, 0], [16, 0], [17, 0]],
      staticLightSources: [
        createResolvedLightSource('near', [1, 1.5, 1], localProbeLight),
        createResolvedLightSource('far', [33, 1.5, 1], localProbeLight),
      ],
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

    const prepared = prepareBakedFloorLightFieldBuild({
      floorId: 'floor-budget',
      floorCells: [[0, 0], [1, 0], [16, 0], [17, 0]],
      staticLightSources: [
        createResolvedLightSource('near', [1, 1.5, 1], localProbeLight),
        createResolvedLightSource('far', [33, 1.5, 1], localProbeLight),
      ],
      dirtyHint: {
        sequence: 1,
        dirtyCellRect: {
          minCellX: 0,
          maxCellX: 1,
          minCellZ: 0,
          maxCellZ: 0,
        },
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
    const workerBuild = prepareBakedFloorLightFieldWorkerBuild(prepared)

    expect(workerBuild).not.toBeNull()
    expect(workerBuild!.workerInput.chunks.length).toBeLessThanOrEqual(PERF_BUDGETS.maxLocalLightWorkerChunks)
    expect(workerBuild!.workerInput.staticLightSources.length).toBeLessThanOrEqual(
      PERF_BUDGETS.maxLocalLightWorkerLights,
    )
  })

  it('preserves derived slice identities for lighting-only updates', () => {
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
    expect(derivedB.visibleObjects).toBe(derivedA.visibleObjects)
    expect(derivedB.bakedLightBuildInput).not.toBe(derivedA.bakedLightBuildInput)
  })

  it('reuses play-visibility worker inputs for stable identities', () => {
    const paintedCells = {
      '0:0': { cell: [0, 0] as [number, number], layerId: 'default', roomId: 'room-a' },
    }
    const layers = {
      default: { id: 'default', name: 'Default', visible: true, locked: false },
    }
    const placedObjects = {
      player: {
        id: 'player',
        type: 'player' as const,
        assetId: 'core.players_fighter',
        position: [1, 0, 1] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        props: {},
        cell: [0, 0] as [number, number],
        cellKey: '0:0:floor',
        layerId: 'default',
      },
    }
    const wallOpenings = {}
    const innerWalls = {}
    const wallSurfaceProps = {}
    const generatedCharacters: Record<string, GeneratedCharacterRecord> = {}

    const derivedA = getOrBuildPlayVisibilityDerivedState({
      floorId: 'floor-1',
      tool: 'play',
      mapMode: 'indoor',
      paintedCells,
      wallOpenings,
      innerWalls,
      placedObjects,
      wallSurfaceProps,
      layers,
      generatedCharacters,
      objectRegistryVersion: 0,
    })
    const derivedB = getOrBuildPlayVisibilityDerivedState({
      floorId: 'floor-1',
      tool: 'play',
      mapMode: 'indoor',
      paintedCells,
      wallOpenings,
      innerWalls,
      placedObjects,
      wallSurfaceProps,
      layers,
      generatedCharacters,
      objectRegistryVersion: 0,
    })

    expect(derivedB.workerInput).toBe(derivedA.workerInput)
  })
})

function createResolvedLightSource(
  id: string,
  position: [number, number, number],
  light: Partial<ResolvedDungeonLightSource['light']> = {},
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
      color: light.color ?? '#ff9944',
      intensity: light.intensity ?? 1.5,
      distance: light.distance ?? 8,
      decay: light.decay ?? 2,
      flicker: light.flicker,
    },
    position,
    linearColor: [1, 0.5583403896342679, 0.05780543019106723],
  }
}

function createFloorData(): DungeonRoomData {
  return {
    floorId: 'floor-budget',
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
