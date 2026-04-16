import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import {
  createProjectedGroundDecalGeometry,
  findProjectedGroundHit,
  getProjectedGroundOrientation,
} from './ProjectedGroundDecal'

describe('ProjectedGroundDecal helpers', () => {
  it('finds the closest registered receiver below the origin', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2), new THREE.MeshBasicMaterial())
    mesh.position.set(0, 0, 0)
    mesh.updateMatrixWorld(true)

    const hit = findProjectedGroundHit(new THREE.Vector3(0, 0, 0), [mesh])

    expect(hit?.object).toBe(mesh)
    expect(hit?.point.y).toBeCloseTo(0.1)
    expect(hit?.normal.y).toBeCloseTo(1)
  })

  it('builds decal geometry relative to the anchor transform', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2), new THREE.MeshBasicMaterial())
    mesh.position.set(0, 0, 0)
    mesh.updateMatrixWorld(true)

    const anchorMatrixWorld = new THREE.Matrix4().makeTranslation(0, 0, 0)
    const geometry = createProjectedGroundDecalGeometry({
      origin: new THREE.Vector3(0, 0, 0),
      receivers: [mesh],
      size: 1,
      anchorMatrixWorld,
    })

    expect(geometry).not.toBeNull()
    expect(geometry?.getAttribute('position').count ?? 0).toBeGreaterThan(0)
    geometry?.dispose()
  })

  it('uses a fixed world-up projection orientation', () => {
    const orientation = getProjectedGroundOrientation()
    const projectedUp = new THREE.Vector3(0, 0, 1).applyEuler(orientation)

    expect(projectedUp.x).toBeCloseTo(0)
    expect(projectedUp.y).toBeCloseTo(1)
    expect(projectedUp.z).toBeCloseTo(0)
  })
})
