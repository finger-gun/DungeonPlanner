import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import type { DungeonObjectRecord } from '../../store/useDungeonStore'
import { buildPropLightPoolAssignments, getPropLightWorldPosition } from './propLightPool'

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
    const objects = [
      createObject('far', [12, 0, 0]),
      createObject('near', [1, 0, 0]),
      createObject('mid', [4, 0, 0]),
    ]

    const assignments = buildPropLightPoolAssignments({
      objects,
      visibility: visibleVisibility,
      useLineOfSightPostMask: false,
      cameraPosition: [0, 0, 0],
      maxLights: 2,
    })

    expect(assignments.map((assignment) => assignment.key)).toEqual(['near', 'mid'])
  })

  it('only keeps lights whose influence overlaps the view or near-view margin', () => {
    const assignments = buildPropLightPoolAssignments({
      objects: [
        createObject('visible', [0, 0, -5]),
        createObject('influence-overlaps-view', [6, 0, -5]),
        createObject('near-view-margin', [8, 0, -5]),
        createObject('outside-view', [10, 0, -5]),
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
      objects: [
        createObject('near-view-margin', [8, 0, -5]),
        createObject('visible', [0, 0, -5]),
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
      objects: [createObject('hidden', [1, 0, 0])],
      visibility: {
        getObjectVisibility: () => 'hidden',
      },
      useLineOfSightPostMask: false,
      cameraPosition: [0, 0, 0],
      maxLights: 1,
    })

    expect(assignments).toEqual([])
  })
})

function createObject(
  id: string,
  position: [number, number, number],
): DungeonObjectRecord {
  return {
    id,
    type: 'prop',
    assetId: 'dungeon.props_candle_lit',
    position,
    rotation: [0, 0, 0],
    props: {},
    cell: [0, 0],
    cellKey: '0,0:floor',
    layerId: 'layer-1',
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
