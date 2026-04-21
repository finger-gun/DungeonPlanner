import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import type { DungeonObjectRecord } from '../../store/useDungeonStore'
import type { PropLight } from '../../content-packs/types'
import {
  buildPropLightPoolAssignments,
  buildVisiblePropLightAssignments,
  distributeForwardPlusLightBudget,
  getDesiredPropLightPoolSize,
  getPropLightRenderCapacity,
  getPropLightWorldPosition,
  precomputeLightSources,
  type PropLightSource,
} from './propLightPool'

const CANDLE_LIGHT: PropLight = {
  color: '#ff9040',
  intensity: 1,
  // distance matches the dungeon candle_lit asset — the frustum-culling tests
  // are calibrated to this value (outside-view at [10,0,-5] is just outside
  // the near-view margin sphere of radius 4.5+1.5=6.0).
  distance: 4.5,
  decay: 2,
}

const visibleVisibility = {
  getObjectVisibility: () => 'visible' as const,
}

describe('propLightPool', () => {
  it('projects local light offsets into world space', () => {
    const position = getPropLightWorldPosition(
      {
        position: [1, 2, 3],
        rotation: [0, 0, Math.PI / 2],
      },
      [0, 0.58, 0],
    )

    expect(position.map((value) => Number(value.toFixed(2)))).toEqual([0.42, 2, 3])
  })

  it('keeps the closest prop lights when the pool is capped', () => {
    const lightSources = [
      createLightSource('far', [12, 0, 0]),
      createLightSource('near', [1, 0, 0]),
      createLightSource('mid', [4, 0, 0]),
    ]

    const assignments = buildPropLightPoolAssignments({
      lightSources,
      visibility: visibleVisibility,
      useLineOfSightPostMask: false,
      cameraPosition: [0, 0, 0],
      maxLights: 2,
    })

    expect(assignments.map((assignment) => assignment.key)).toEqual(['near', 'mid'])
  })

  it('only keeps lights whose influence overlaps the view or near-view margin', () => {
    const assignments = buildPropLightPoolAssignments({
      lightSources: [
        createLightSource('visible', [0, 0, -5]),
        createLightSource('influence-overlaps-view', [6, 0, -5]),
        createLightSource('near-view-margin', [8, 0, -5]),
        createLightSource('outside-view', [10, 0, -5]),
      ],
      visibility: visibleVisibility,
      useLineOfSightPostMask: false,
      cameraPosition: [0, 0, 0],
      cameraFrustum: createCameraFrustum(),
      maxLights: 8,
    })

    expect(assignments.map((assignment) => assignment.key)).toEqual([
      'visible',
      'influence-overlaps-view',
      'near-view-margin',
    ])
  })

  it('prioritizes lights already affecting the viewport over near-view lights', () => {
    const assignments = buildPropLightPoolAssignments({
      lightSources: [
        createLightSource('near-view-margin', [8, 0, -5]),
        createLightSource('visible', [0, 0, -5]),
      ],
      visibility: visibleVisibility,
      useLineOfSightPostMask: false,
      cameraPosition: [0, 0, 0],
      cameraFrustum: createCameraFrustum(),
      maxLights: 1,
    })

    expect(assignments.map((assignment) => assignment.key)).toEqual(['visible'])
  })

  it('skips hidden prop lights when line-of-sight post masking is inactive', () => {
    const assignments = buildPropLightPoolAssignments({
      lightSources: [createLightSource('hidden', [1, 0, 0])],
      visibility: {
        getObjectVisibility: () => 'hidden',
      },
      useLineOfSightPostMask: false,
      cameraPosition: [0, 0, 0],
      maxLights: 1,
    })

    expect(assignments).toEqual([])
  })

  it('precomputeLightSources only returns objects with registered lights', () => {
    // Objects without a valid assetId produce no light source.
    const objects: DungeonObjectRecord[] = [
      createObject('no-asset', [0, 0, 0], null),
      createObject('unknown-asset', [1, 0, 0], 'unknown.asset.id'),
    ]
    expect(precomputeLightSources(objects)).toHaveLength(0)
  })

  it('does not allocate pooled lights when there are no light sources', () => {
    expect(getDesiredPropLightPoolSize(0)).toBe(0)
  })

  it('grows render capacity in stable 32-light chunks', () => {
    expect(getPropLightRenderCapacity(0)).toBe(0)
    expect(getPropLightRenderCapacity(1)).toBe(32)
    expect(getPropLightRenderCapacity(32)).toBe(32)
    expect(getPropLightRenderCapacity(33)).toBe(64)
  })

  it('distributes the renderer light budget across multiple light groups', () => {
    expect(distributeForwardPlusLightBudget([40, 128], 256)).toEqual([40, 128])
    expect(distributeForwardPlusLightBudget([200, 128], 256)).toEqual([200, 56])
    expect(distributeForwardPlusLightBudget([128, 128, 128], 256)).toEqual([128, 128, 0])
  })

  it('builds a stable visible light list without camera input', () => {
    const assignments = buildVisiblePropLightAssignments({
      lightSources: [
        createLightSource('dim', [12, 0, 0], { ...CANDLE_LIGHT, intensity: 0.5 }),
        createLightSource('bright', [1, 0, 0], { ...CANDLE_LIGHT, intensity: 2 }),
        createLightSource('hidden', [4, 0, 0]),
      ],
      visibility: {
        getObjectVisibility: (object) => object.id === 'hidden' ? 'hidden' : 'visible',
      },
      useLineOfSightPostMask: false,
      maxLights: 2,
    })

    expect(assignments.map((assignment) => assignment.key)).toEqual(['bright', 'dim'])
  })
})

function createObject(
  id: string,
  position: [number, number, number],
  assetId: string | null,
): DungeonObjectRecord {
  return {
    id,
    type: 'prop',
    assetId,
    position,
    rotation: [0, 0, 0],
    props: {},
    cell: [0, 0],
    cellKey: '0,0:floor',
    layerId: 'layer-1',
  }
}

function createLightSource(
  id: string,
  position: [number, number, number],
  light: PropLight = CANDLE_LIGHT,
): PropLightSource {
  return {
    key: id,
    object: createObject(id, position, null),
    light,
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
