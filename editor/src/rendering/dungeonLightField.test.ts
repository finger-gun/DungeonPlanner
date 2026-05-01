import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type {
  DungeonObjectRecord,
  PaintedCells,
} from '../store/useDungeonStore'
import type { PropLight } from '../content-packs/types'
import {
  buildPropBakedLightProbe,
  classifyDynamicLightSources,
  clearBakedFloorLightFieldCache,
  getBakedLightDistanceFalloff,
  DEFAULT_BAKED_LIGHT_CHANNEL_CAP,
  DEFAULT_DYNAMIC_LIGHT_POOL_SIZE,
  doesBoundsIntersectDirtyChunks,
  getBakedLightSampleForCell,
  getLightDistanceFalloff,
  getOrBuildBakedFloorLightField,
  prepareBakedFloorLightFieldBuild,
  prepareBakedFloorLightFieldWorkerBuild,
  pruneBakedFloorLightFieldCache,
  getStaticLightSourcesForBounds,
  sampleStaticLightAtWorldPosition,
  sampleBakedLightFieldAtWorldPosition,
  type ResolvedDungeonLightSource,
} from './dungeonLightField'
import { doesLineIntersectClosedWall, getWallWorldSegment } from './dungeonLightFieldOcclusion'
import { getStableLightFlickerCoefficients } from './lightFlickerMath'

const TORCH_LIGHT: PropLight = {
  color: '#ff9944',
  intensity: 1.5,
  distance: 8,
  decay: 2,
}

describe('dungeonLightField', () => {
  it('uses quadratic-like falloff inside the light radius', () => {
    expect(getLightDistanceFalloff(TORCH_LIGHT, 0)).toBe(1)
    expect(getLightDistanceFalloff(TORCH_LIGHT, 4)).toBeCloseTo(0.25)
    expect(getLightDistanceFalloff(TORCH_LIGHT, 8)).toBe(0)
  })

  it('gives baked lighting a hotter core and slightly longer reach', () => {
    expect(getBakedLightDistanceFalloff(TORCH_LIGHT, 0)).toBeGreaterThan(1)
    expect(getBakedLightDistanceFalloff(TORCH_LIGHT, 4)).toBeGreaterThan(getLightDistanceFalloff(TORCH_LIGHT, 4))
    expect(getBakedLightDistanceFalloff(TORCH_LIGHT, 8.4)).toBeGreaterThan(0)
  })

  it('samples warm baked light contribution at floor cell centers', () => {
    const sample = sampleStaticLightAtWorldPosition(
      [createResolvedLightSource('torch', [1, 1.5, 1])],
      [1, 0, 1],
    )

    expect(sample[0]).toBeGreaterThan(sample[1])
    expect(sample[1]).toBeGreaterThan(sample[2])
    expect(sample[0]).toBeGreaterThan(0.8)
  })

  it('blocks baked light through solid inner walls', () => {
    clearBakedFloorLightFieldCache()

    const field = getOrBuildBakedFloorLightField({
      floorId: 'floor-occluded',
      floorCells: [[0, 0], [1, 0]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
      occlusionInput: {
        paintedCells: createPaintedCells(),
        wallOpenings: {},
        innerWalls: {
          separator: { wallKey: '0:0:east', layerId: 'default' },
        },
      },
    })

    expect(getBakedLightSampleForCell(field, '0:0')[0]).toBeGreaterThan(0.5)
    expect(getBakedLightSampleForCell(field, '1:0')).toEqual([0, 0, 0])
  })

  it('allows baked light through wall openings', () => {
    clearBakedFloorLightFieldCache()

    const field = getOrBuildBakedFloorLightField({
      floorId: 'floor-open-wall',
      floorCells: [[0, 0], [1, 0]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
      occlusionInput: {
        paintedCells: createPaintedCells(),
        wallOpenings: {
          door: {
            id: 'door',
            assetId: null,
            wallKey: '0:0:east',
            width: 1,
            layerId: 'default',
          },
        },
        innerWalls: {
          separator: { wallKey: '0:0:east', layerId: 'default' },
        },
      },
    })

    expect(getBakedLightSampleForCell(field, '1:0')[0]).toBeGreaterThan(0)
  })

  it('fully rebakes cached chunks when occlusion changes without cell or light changes', () => {
    clearBakedFloorLightFieldCache()

    const first = getOrBuildBakedFloorLightField({
      floorId: 'floor-live-occlusion',
      floorCells: [[0, 0], [1, 0]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
      occlusionInput: {
        paintedCells: createPaintedCells(),
        wallOpenings: {
          door: {
            id: 'door',
            assetId: null,
            wallKey: '0:0:east',
            width: 1,
            layerId: 'default',
          },
        },
        innerWalls: {
          separator: { wallKey: '0:0:east', layerId: 'default' },
        },
      },
    })

    const rebuilt = getOrBuildBakedFloorLightField({
      floorId: 'floor-live-occlusion',
      floorCells: [[0, 0], [1, 0]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
      occlusionInput: {
        paintedCells: createPaintedCells(),
        wallOpenings: {},
        innerWalls: {
          separator: { wallKey: '0:0:east', layerId: 'default' },
        },
      },
    })

    expect(rebuilt.lightFieldTexture).toBe(first.lightFieldTexture)
    expect(rebuilt.chunks.filter((chunk) => chunk.dirty).map((chunk) => chunk.key)).toEqual(['0:0'])
    expect(getBakedLightSampleForCell(first, '1:0')[0]).toBeGreaterThan(0)
    expect(getBakedLightSampleForCell(rebuilt, '1:0')).toEqual([0, 0, 0])
  })

  it('limits occlusion-driven dirty chunks to the edited wall region', () => {
    clearBakedFloorLightFieldCache()

    getOrBuildBakedFloorLightField({
      floorId: 'floor-occlusion-localized',
      floorCells: [[0, 0], [8, 0], [16, 0], [17, 0]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
      occlusionInput: {
        paintedCells: {
          '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
          '8:0': { cell: [8, 0], layerId: 'default', roomId: 'room-b' },
          '16:0': { cell: [16, 0], layerId: 'default', roomId: 'room-c' },
          '17:0': { cell: [17, 0], layerId: 'default', roomId: 'room-d' },
        },
        wallOpenings: {},
        innerWalls: {},
      },
    })

    const rebuilt = getOrBuildBakedFloorLightField({
      floorId: 'floor-occlusion-localized',
      floorCells: [[0, 0], [8, 0], [16, 0], [17, 0]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
      occlusionInput: {
        paintedCells: {
          '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
          '8:0': { cell: [8, 0], layerId: 'default', roomId: 'room-b' },
          '16:0': { cell: [16, 0], layerId: 'default', roomId: 'room-c' },
          '17:0': { cell: [17, 0], layerId: 'default', roomId: 'room-d' },
        },
        wallOpenings: {
          farDoor: {
            id: 'farDoor',
            assetId: null,
            wallKey: '16:0:east',
            width: 1,
            layerId: 'default',
          },
        },
        innerWalls: {},
      },
    })

    expect(rebuilt.dirtyChunkKeys).toEqual(['1:0', '2:0'])
    expect(rebuilt.chunks.filter((chunk) => chunk.dirty).map((chunk) => chunk.key)).toEqual(['1:0', '2:0'])
  })

  it('prunes cached light fields for floors that are no longer present', () => {
    clearBakedFloorLightFieldCache()

    const activeField = getOrBuildBakedFloorLightField({
      floorId: 'floor-active',
      floorCells: [[0, 0]],
      staticLightSources: [createResolvedLightSource('torch-active', [1, 1.5, 1])],
      occlusionInput: {
        paintedCells: createPaintedCells(),
        wallOpenings: {},
        innerWalls: {},
      },
    })
    const removedField = getOrBuildBakedFloorLightField({
      floorId: 'floor-removed',
      floorCells: [[0, 0]],
      staticLightSources: [createResolvedLightSource('torch-removed', [1, 1.5, 1])],
      occlusionInput: {
        paintedCells: createPaintedCells(),
        wallOpenings: {},
        innerWalls: {},
      },
    })

    pruneBakedFloorLightFieldCache(['floor-active'])

    const rebuiltActiveField = getOrBuildBakedFloorLightField({
      floorId: 'floor-active',
      floorCells: [[0, 0]],
      staticLightSources: [createResolvedLightSource('torch-active', [1, 1.5, 1])],
      occlusionInput: {
        paintedCells: createPaintedCells(),
        wallOpenings: {},
        innerWalls: {},
      },
    })
    const rebuiltRemovedField = getOrBuildBakedFloorLightField({
      floorId: 'floor-removed',
      floorCells: [[0, 0]],
      staticLightSources: [createResolvedLightSource('torch-removed', [1, 1.5, 1])],
      occlusionInput: {
        paintedCells: createPaintedCells(),
        wallOpenings: {},
        innerWalls: {},
      },
    })

    expect(rebuiltActiveField).toBe(activeField)
    expect(rebuiltRemovedField).not.toBe(removedField)
    expect(rebuiltRemovedField.lightFieldTexture).not.toBe(removedField.lightFieldTexture)
  })

  it('does not bleed smoothed floor light across a fully closed shared wall', () => {
    clearBakedFloorLightFieldCache()

    const field = getOrBuildBakedFloorLightField({
      floorId: 'floor-split-boundary',
      floorCells: [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [3, 0], [2, 1], [3, 1]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
      occlusionInput: {
        paintedCells: {
          '0:0': { cell: [0, 0], layerId: 'default', roomId: 'left-room' },
          '1:0': { cell: [1, 0], layerId: 'default', roomId: 'left-room' },
          '0:1': { cell: [0, 1], layerId: 'default', roomId: 'left-room' },
          '1:1': { cell: [1, 1], layerId: 'default', roomId: 'left-room' },
          '2:0': { cell: [2, 0], layerId: 'default', roomId: 'right-room' },
          '3:0': { cell: [3, 0], layerId: 'default', roomId: 'right-room' },
          '2:1': { cell: [2, 1], layerId: 'default', roomId: 'right-room' },
          '3:1': { cell: [3, 1], layerId: 'default', roomId: 'right-room' },
        },
        wallOpenings: {},
        innerWalls: {},
      },
    })

    const blockedSideSample = sampleBakedLightFieldAtWorldPosition(field, [4.1, 0, 1])
    expect(blockedSideSample[0]).toBeLessThan(1e-4)
    expect(blockedSideSample[1]).toBeLessThan(1e-4)
    expect(blockedSideSample[2]).toBeLessThan(1e-4)
  })

  it('does not create an artificial dark fade band along outer perimeter walls', () => {
    clearBakedFloorLightFieldCache()

    const field = getOrBuildBakedFloorLightField({
      floorId: 'floor-perimeter-fade',
      floorCells: [[0, 0], [1, 0], [0, 1], [1, 1]],
      staticLightSources: [createResolvedLightSource('torch', [2, 1.5, 2])],
      occlusionInput: {
        paintedCells: {
          '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room' },
          '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room' },
          '0:1': { cell: [0, 1], layerId: 'default', roomId: 'room' },
          '1:1': { cell: [1, 1], layerId: 'default', roomId: 'room' },
        },
        wallOpenings: {},
        innerWalls: {},
      },
    })

    const nearNorthWall = sampleBakedLightFieldAtWorldPosition(field, [2, 0, 3.6])
    expect(nearNorthWall[0]).toBeGreaterThan(0.35)
    expect(nearNorthWall[1]).toBeGreaterThan(0.18)
  })

  it('maps wall directions to the correct world-space segments for occlusion', () => {
    expect(getWallWorldSegment('0:0:north')).toEqual([0, 2, 2, 2])
    expect(getWallWorldSegment('0:0:south')).toEqual([0, 0, 2, 0])
    expect(getWallWorldSegment('0:0:east')).toEqual([2, 0, 2, 2])
    expect(getWallWorldSegment('0:0:west')).toEqual([0, 0, 0, 2])
  })

  it('treats wall endpoint hits as blocked to prevent corner leaks', () => {
    expect(doesLineIntersectClosedWall(
      [1, 0, 1],
      [3, 0, 3],
      new Set(['0:0:east']),
    )).toBe(true)
  })

  it('caps overlapping baked light intensity at the configured ceiling', () => {
    const brightWarmLight: PropLight = {
      color: '#ffffff',
      intensity: 4,
      distance: 8,
      decay: 1,
    }
    const sample = sampleStaticLightAtWorldPosition(
      [
        createResolvedLightSource('torch-a', [1, 0, 1], brightWarmLight),
        createResolvedLightSource('torch-b', [1, 0, 1], brightWarmLight),
      ],
      [1, 0, 1],
    )

    expect(sample).toEqual([
      DEFAULT_BAKED_LIGHT_CHANNEL_CAP,
      DEFAULT_BAKED_LIGHT_CHANNEL_CAP,
      DEFAULT_BAKED_LIGHT_CHANNEL_CAP,
    ])
  })

  it('preserves warm light hue when overlapping lights hit the baked cap', () => {
    const sample = sampleStaticLightAtWorldPosition(
      [
        createResolvedLightSource('torch-a', [1, 0, 1]),
        createResolvedLightSource('torch-b', [1, 0, 1]),
      ],
      [1, 0, 1],
    )

    expect(sample[0]).toBeCloseTo(DEFAULT_BAKED_LIGHT_CHANNEL_CAP, 5)
    expect(sample[0]).toBeGreaterThan(sample[1])
    expect(sample[1]).toBeGreaterThan(sample[2])
  })

  it('keeps selected lights dynamic even when another light is closer', () => {
    const camera = [0, 0, 0] as const
    const frustum = createCameraFrustum()
    const lightSources = [
      createResolvedLightSource('selected', [6, 1.5, -5]),
      createResolvedLightSource('nearby', [0, 1.5, -5]),
    ]

    const result = classifyDynamicLightSources({
      lightSources,
      selectedKeys: new Set(['selected']),
      cameraPosition: camera,
      cameraFrustum: frustum,
      maxDynamicLights: 1,
    })

    expect(result.staticLightSources).toHaveLength(2)
    expect(result.dynamicLightSources.map((lightSource) => lightSource.key)).toEqual(['selected'])
  })

  it('demotes far lights out of the dynamic pool while keeping them baked', () => {
    const lightSources = [
      createResolvedLightSource('near', [0, 1.5, -5]),
      createResolvedLightSource('far', [40, 1.5, -5]),
    ]

    const result = classifyDynamicLightSources({
      lightSources,
      cameraPosition: [0, 0, 0],
      cameraFrustum: createCameraFrustum(),
      maxDynamicLights: DEFAULT_DYNAMIC_LIGHT_POOL_SIZE,
    })

    expect(result.staticLightSources.map((lightSource) => lightSource.key)).toEqual(['near', 'far'])
    expect(result.dynamicLightSources.map((lightSource) => lightSource.key)).toEqual(['near'])
  })

  it('caches baked fields by floor id and source hash', () => {
    clearBakedFloorLightFieldCache()

    const input = {
      floorId: 'floor-1',
      floorCells: [[0, 0], [1, 0]] as Array<[number, number]>,
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
    }

    const first = getOrBuildBakedFloorLightField(input)
    const second = getOrBuildBakedFloorLightField(input)

    expect(first).toBe(second)
    expect(first.chunks).toHaveLength(1)
    expect(getBakedLightSampleForCell(first, '0:0')[0]).toBeGreaterThan(0)
    expect(first.lightFieldTextureSize).toEqual({ width: 3, height: 2 })
    expect(first.lightFieldGridSize).toEqual({ widthCells: 2, heightCells: 1 })
  })

  it('marks affected chunks dirty when a light moves between rebuilds', () => {
    clearBakedFloorLightFieldCache()

    const first = getOrBuildBakedFloorLightField({
      floorId: 'floor-1',
      floorCells: [[0, 0], [9, 0]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
    })

    const rebuilt = getOrBuildBakedFloorLightField({
      floorId: 'floor-1',
      floorCells: [[0, 0], [9, 0]],
      staticLightSources: [createResolvedLightSource('torch', [19, 1.5, 1])],
    })

    expect(rebuilt.dirtyChunkKeys).toEqual(expect.arrayContaining(['0:0', '1:0']))
    expect(rebuilt.chunks.filter((chunk) => chunk.dirty).map((chunk) => chunk.key)).toEqual(['0:0', '1:0'])
    expect(rebuilt.lightFieldTexture).toBe(first.lightFieldTexture)
  })

  it('expands dirty chunk rebuilds with a one-chunk halo to protect interpolation seams', () => {
    clearBakedFloorLightFieldCache()

    getOrBuildBakedFloorLightField({
      floorId: 'floor-seam-halo',
      floorCells: [[0, 0], [8, 0], [16, 0]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
    })

    const rebuilt = getOrBuildBakedFloorLightField({
      floorId: 'floor-seam-halo',
      floorCells: [[0, 0], [8, 0], [16, 0]],
      staticLightSources: [createResolvedLightSource('torch', [2, 1.5, 1])],
    })

    expect(rebuilt.dirtyChunkKeys).toEqual(['0:0', '1:0'])
    expect(rebuilt.chunks.filter((chunk) => chunk.dirty).map((chunk) => chunk.key)).toEqual(['0:0', '1:0'])
  })

  it('prepares worker-friendly rebuild payloads for reusable baked layouts', () => {
    clearBakedFloorLightFieldCache()

    getOrBuildBakedFloorLightField({
      floorId: 'floor-worker-rebuild',
      floorCells: [[0, 0], [8, 0], [16, 0]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
    })

    const prepared = prepareBakedFloorLightFieldBuild({
      floorId: 'floor-worker-rebuild',
      floorCells: [[0, 0], [8, 0], [16, 0]],
      staticLightSources: [createResolvedLightSource('torch', [2, 1.5, 1])],
    })
    const workerBuild = prepareBakedFloorLightFieldWorkerBuild(prepared)

    expect(workerBuild).not.toBeNull()
    expect(workerBuild!.workerInput.chunks.map((chunk) => chunk.key)).toEqual(['0:0', '1:0'])
    expect(workerBuild!.workerInput.sourceHash).toBe(prepared.sourceHash)
  })

  it('prepares worker-friendly payloads for uncached lit floors', () => {
    clearBakedFloorLightFieldCache()

    const prepared = prepareBakedFloorLightFieldBuild({
      floorId: 'floor-worker-initial',
      floorCells: [[0, 0], [8, 0]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
    })
    const workerBuild = prepareBakedFloorLightFieldWorkerBuild(prepared)

    expect(workerBuild).not.toBeNull()
    expect(workerBuild!.workerInput.chunks.map((chunk) => chunk.key)).toEqual(['0:0', '1:0'])
    expect(workerBuild!.workerInput.staticLightSources.map((lightSource) => lightSource.key)).toEqual(['torch'])
  })

  it('uses dirty hints to bound incremental worker payloads to local chunks', () => {
    clearBakedFloorLightFieldCache()
    const localProbeLight: PropLight = {
      ...TORCH_LIGHT,
      distance: 1.5,
    }

    getOrBuildBakedFloorLightField({
      floorId: 'floor-worker-dirty-hint',
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
      floorId: 'floor-worker-dirty-hint',
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
    expect(workerBuild!.workerInput.chunks.map((chunk) => chunk.key)).toEqual(['0:0'])
    expect(workerBuild!.workerInput.staticLightSources.map((lightSource) => lightSource.key)).toEqual(['near'])
  })

  it('reuses a cheap identity-based source hash for stable derived inputs', () => {
    clearBakedFloorLightFieldCache()

    const floorCells: [number, number][] = [[0, 0], [1, 0]]
    const staticLightSources = [createResolvedLightSource('torch', [1, 1.5, 1])]
    const occlusionInput = {
      paintedCells: {
        '0:0': { cell: [0, 0] as [number, number], layerId: 'default', roomId: 'room-a' },
        '1:0': { cell: [1, 0] as [number, number], layerId: 'default', roomId: 'room-a' },
      },
      wallOpenings: {},
      innerWalls: {},
      wallSurfaceProps: {},
    }

    const first = prepareBakedFloorLightFieldBuild({
      floorId: 'floor-stable-hash',
      floorCells,
      staticLightSources,
      occlusionInput,
    })
    const second = prepareBakedFloorLightFieldBuild({
      floorId: 'floor-stable-hash',
      floorCells,
      staticLightSources,
      occlusionInput,
    })

    expect(second.sourceHash).toBe(first.sourceHash)
  })

  it('builds corner-sampled light textures for shader interpolation', () => {
    clearBakedFloorLightFieldCache()

    const field = getOrBuildBakedFloorLightField({
      floorId: 'floor-1',
      floorCells: [[0, 0], [1, 0]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
    })

    expect(field.lightFieldTexture).not.toBeNull()
    expect(field.flickerLightFieldTextures.every((texture) => texture === null)).toBe(true)
    expect(field.cornerSampleByKey['0:0']?.[0]).toBeGreaterThan(0)
    expect(field.cornerSampleByKey['1:0']?.[0]).toBeGreaterThan(field.cornerSampleByKey['2:0']?.[0] ?? 0)
  })

  it('builds directional two-probe baked light samples for props from world bounds', () => {
    clearBakedFloorLightFieldCache()

    const field = getOrBuildBakedFloorLightField({
      floorId: 'floor-props',
      floorCells: [[0, 0], [1, 0]],
      staticLightSources: [createResolvedLightSource('torch', [3.5, 1.8, 1], {
        ...TORCH_LIGHT,
        intensity: 0.9,
      })],
    })
    const probe = buildPropBakedLightProbe(
      field,
      new THREE.Box3(new THREE.Vector3(0.75, 0, 0.75), new THREE.Vector3(1.25, 2, 1.25)),
    )

    expect(probe).not.toBeNull()
    expect(probe!.topY).toBeGreaterThan(probe!.baseY)
    expect(probe!.lightDirection[0]).toBeGreaterThan(0.9)
    expect(probe!.directionalStrength).toBeGreaterThan(0.9)
  })

  it('uses the dominant static light vector for backlit prop directionality', () => {
    clearBakedFloorLightFieldCache()

    const field = getOrBuildBakedFloorLightField({
      floorId: 'floor-prop-backlight',
      floorCells: [[0, 0], [0, 1], [0, 2], [0, 3]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.8, 3.5], {
        ...TORCH_LIGHT,
        intensity: 1.1,
      })],
    })
    const probe = buildPropBakedLightProbe(
      field,
      new THREE.Box3(new THREE.Vector3(0.75, 0, 0.75), new THREE.Vector3(1.25, 2, 1.25)),
    )

    expect(probe).not.toBeNull()
    expect(probe!.lightDirection[2]).toBeGreaterThan(0.9)
    expect(probe!.directionalStrength).toBeGreaterThan(0.9)
  })

  it('keeps prop probes lit inside a closed room after wall-edge corner blocking', () => {
    clearBakedFloorLightFieldCache()

    const field = getOrBuildBakedFloorLightField({
      floorId: 'floor-prop-room',
      floorCells: [[0, 0], [1, 0], [0, 1], [1, 1]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
      occlusionInput: {
        paintedCells: {
          '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room' },
          '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room' },
          '0:1': { cell: [0, 1], layerId: 'default', roomId: 'room' },
          '1:1': { cell: [1, 1], layerId: 'default', roomId: 'room' },
        },
        wallOpenings: {},
        innerWalls: {},
      },
    })

    const probe = buildPropBakedLightProbe(
      field,
      new THREE.Box3(new THREE.Vector3(0.8, 0, 0.8), new THREE.Vector3(1.2, 2, 1.2)),
    )

    expect(probe).not.toBeNull()
    expect(probe!.baseLight[0]).toBeGreaterThan(0)
  })

  it('samples baked light smoothly between corner samples', () => {
    clearBakedFloorLightFieldCache()

    const field = getOrBuildBakedFloorLightField({
      floorId: 'floor-interpolation',
      floorCells: [[0, 0], [1, 0]],
      staticLightSources: [createResolvedLightSource('torch', [3.5, 1.8, 1], {
        ...TORCH_LIGHT,
        intensity: 0.9,
      })],
    })

    const left = sampleBakedLightFieldAtWorldPosition(field, [0.5, 0, 0.5])
    const middle = sampleBakedLightFieldAtWorldPosition(field, [1, 0, 0.5])
    const right = sampleBakedLightFieldAtWorldPosition(field, [1.5, 0, 0.5])

    expect(middle[0]).toBeGreaterThan(left[0])
    expect(middle[0]).toBeLessThan(right[0])
  })

  it('limits prop probe sampling to lights whose influence overlaps the prop chunks', () => {
    clearBakedFloorLightFieldCache()
    const localProbeLight: PropLight = {
      ...TORCH_LIGHT,
      distance: 1.5,
    }

    const field = getOrBuildBakedFloorLightField({
      floorId: 'floor-prop-locality',
      floorCells: [[0, 0], [1, 0], [8, 0], [9, 0]],
      staticLightSources: [
        createResolvedLightSource('near', [1, 1.5, 1], localProbeLight),
        createResolvedLightSource('far', [21, 1.5, 1], localProbeLight),
      ],
    })

    const localLights = getStaticLightSourcesForBounds(
      field,
      new THREE.Box3(new THREE.Vector3(0.75, 0, 0.75), new THREE.Vector3(1.25, 2, 1.25)),
    )

    expect(localLights.map((lightSource) => lightSource.key)).toEqual(['near'])
  })

  it('only flags props inside dirty light chunks for baked probe recompute', () => {
    clearBakedFloorLightFieldCache()

    getOrBuildBakedFloorLightField({
      floorId: 'floor-prop-dirty',
      floorCells: [[0, 0], [1, 0], [8, 0], [9, 0]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
    })

    const rebuilt = getOrBuildBakedFloorLightField({
      floorId: 'floor-prop-dirty',
      floorCells: [[0, 0], [1, 0], [8, 0], [9, 0]],
      staticLightSources: [createResolvedLightSource('torch', [17, 1.5, 1])],
    })

    expect(doesBoundsIntersectDirtyChunks(
      rebuilt,
      new THREE.Box3(new THREE.Vector3(0.75, 0, 0.75), new THREE.Vector3(1.25, 2, 1.25)),
    )).toBe(true)
    expect(doesBoundsIntersectDirtyChunks(
      rebuilt,
      new THREE.Box3(new THREE.Vector3(16.75, 0, 0.75), new THREE.Vector3(17.25, 2, 1.25)),
    )).toBe(true)
    expect(doesBoundsIntersectDirtyChunks(
      rebuilt,
      new THREE.Box3(new THREE.Vector3(32.75, 0, 0.75), new THREE.Vector3(33.25, 2, 1.25)),
    )).toBe(false)
  })

  it('builds a baked flicker texture when static lights opt into flicker', () => {
    clearBakedFloorLightFieldCache()

    const field = getOrBuildBakedFloorLightField({
      floorId: 'floor-flicker',
      floorCells: [[0, 0], [1, 0]],
      staticLightSources: [
        createResolvedLightSource('torch', [1, 1.5, 1], {
          ...TORCH_LIGHT,
          flicker: true,
        }),
      ],
    })

    expect(field.flickerLightFieldTextures.some((texture) => texture !== null)).toBe(true)
    expect(field.flickerLightFieldTextures[0]).not.toBeNull()
    expect(field.flickerLightFieldTextures[1]).not.toBeNull()
    expect(field.flickerLightFieldTextures[2]).not.toBeNull()
    expect(field.lightFieldTextureSize).toEqual({ width: 3, height: 2 })
  })

  it('assigns stable zero-mean flicker coefficients per light', () => {
    const coefficients = getStableLightFlickerCoefficients('torch-a')
    const otherCoefficients = getStableLightFlickerCoefficients('torch-b')

    expect(coefficients[0] + coefficients[1] + coefficients[2]).toBeCloseTo(0, 6)
    expect(Math.hypot(coefficients[0], coefficients[1], coefficients[2])).toBeCloseTo(1, 6)
    expect(Math.max(...coefficients)).toBeGreaterThan(0)
    expect(Math.min(...coefficients)).toBeLessThan(0)
    expect(otherCoefficients).not.toEqual(coefficients)
  })

  it('rebuilds the baked field when flicker state changes', () => {
    clearBakedFloorLightFieldCache()

    const first = getOrBuildBakedFloorLightField({
      floorId: 'floor-1',
      floorCells: [[0, 0], [1, 0]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
    })
    const second = getOrBuildBakedFloorLightField({
      floorId: 'floor-1',
      floorCells: [[0, 0], [1, 0]],
      staticLightSources: [
        createResolvedLightSource('torch', [1, 1.5, 1], {
          ...TORCH_LIGHT,
          flicker: true,
        }),
      ],
    })

    expect(second).not.toBe(first)
    expect(second.flickerLightFieldTextures.some((texture) => texture !== null)).toBe(true)
  })
})

function createResolvedLightSource(
  id: string,
  position: [number, number, number],
  light: PropLight = TORCH_LIGHT,
): ResolvedDungeonLightSource {
  const color = new THREE.Color(light.color)
  const object: DungeonObjectRecord = {
    id,
    type: 'prop',
    assetId: 'dungeon.props_torch',
    position,
    rotation: [0, 0, 0],
    props: {},
    cell: [0, 0],
    cellKey: '0:0:floor',
    layerId: 'default',
  }

  return {
    key: id,
    object,
    light,
    position,
    linearColor: [color.r, color.g, color.b],
  }
}

function createCameraFrustum() {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camera.position.set(0, 0, 0)
  camera.lookAt(0, 0, -1)
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()
  return new THREE.Frustum().setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
  )
}

function createPaintedCells(): PaintedCells {
  return {
    '0:0': { cell: [0, 0], layerId: 'default', roomId: 'left-room' },
    '1:0': { cell: [1, 0], layerId: 'default', roomId: 'right-room' },
  }
}
