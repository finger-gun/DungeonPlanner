import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { DungeonObjectRecord } from '../store/useDungeonStore'
import type { PropLight } from '../content-packs/types'
import {
  classifyDynamicLightSources,
  clearBakedFloorLightFieldCache,
  DEFAULT_BAKED_LIGHT_CHANNEL_CAP,
  DEFAULT_DYNAMIC_LIGHT_POOL_SIZE,
  getBakedLightSampleForCell,
  getLightDistanceFalloff,
  getOrBuildBakedFloorLightField,
  sampleStaticLightAtWorldPosition,
  type ResolvedDungeonLightSource,
} from './dungeonLightField'

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

  it('samples warm baked light contribution at floor cell centers', () => {
    const sample = sampleStaticLightAtWorldPosition(
      [createResolvedLightSource('torch', [1, 1.5, 1])],
      [1, 0, 1],
    )

    expect(sample[0]).toBeGreaterThan(sample[1])
    expect(sample[1]).toBeGreaterThan(sample[2])
    expect(sample[0]).toBeGreaterThan(0.9)
  })

  it('caps overlapping baked light intensity per channel', () => {
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

    getOrBuildBakedFloorLightField({
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
  })

  it('builds corner-sampled light textures for shader interpolation', () => {
    clearBakedFloorLightFieldCache()

    const field = getOrBuildBakedFloorLightField({
      floorId: 'floor-1',
      floorCells: [[0, 0], [1, 0]],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
    })

    expect(field.lightFieldTexture).not.toBeNull()
    expect(field.cornerSampleByKey['0:0']?.[0]).toBeGreaterThan(0)
    expect(field.cornerSampleByKey['1:0']?.[0]).toBeGreaterThan(field.cornerSampleByKey['2:0']?.[0] ?? 0)
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
