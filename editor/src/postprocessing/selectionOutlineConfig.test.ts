import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import {
  createSelectionOutlineProxy,
  SELECTION_OUTLINE_IGNORE_USER_DATA,
  syncSelectionOutlineProxy,
} from './selectionOutlineConfig'

describe('selectionOutlineConfig', () => {
  it('builds a proxy that skips meshes marked to ignore selection outlines', () => {
    const root = new THREE.Group()
    const outlinedMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
    const ignoredMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
    ignoredMesh.userData[SELECTION_OUTLINE_IGNORE_USER_DATA] = true
    root.add(outlinedMesh, ignoredMesh)

    const proxy = createSelectionOutlineProxy(root)
    expect(proxy).not.toBeNull()

    const proxyMeshes = proxy?.object.children.filter((child) => child instanceof THREE.Mesh) as THREE.Mesh[]
    expect(proxyMeshes).toHaveLength(2)
    expect(proxyMeshes[0]?.visible).toBe(true)
    expect(proxyMeshes[1]?.visible).toBe(false)
    proxy?.dispose()
  })

  it('uses a shared color-write-disabled material for proxy meshes', () => {
    const root = new THREE.Group()
    const meshA = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
    const meshB = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
    root.add(meshA, meshB)

    const proxy = createSelectionOutlineProxy(root)
    expect(proxy).not.toBeNull()

    const [proxyMeshA, proxyMeshB] = proxy?.object.children as THREE.Mesh[]
    expect(proxyMeshA.material).toBe(proxyMeshB.material)
    expect((proxyMeshA.material as THREE.MeshBasicMaterial).colorWrite).toBe(false)
    proxy?.dispose()
  })

  it('syncs the proxy transform from the selected object world transform', () => {
    const parent = new THREE.Group()
    parent.position.set(4, 1, -2)
    parent.rotation.set(0.1, 0.4, 0)

    const root = new THREE.Group()
    root.position.set(1, 0.5, 2)
    root.rotation.set(0.2, 0.3, -0.1)
    root.scale.setScalar(1.1)
    root.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()))
    parent.add(root)

    const proxy = createSelectionOutlineProxy(root)
    expect(proxy).not.toBeNull()

    root.rotation.set(0.35, 1.1, -0.2)
    root.scale.set(1.6, 1.6, 1.6)

    syncSelectionOutlineProxy(proxy?.object, root)

    const expectedPosition = new THREE.Vector3()
    const expectedQuaternion = new THREE.Quaternion()
    const expectedScale = new THREE.Vector3()
    root.getWorldPosition(expectedPosition)
    root.getWorldQuaternion(expectedQuaternion)
    root.getWorldScale(expectedScale)

    expect(proxy?.object.position.toArray()).toEqual(expectedPosition.toArray())
    expect(proxy?.object.quaternion.toArray()).toEqual(expectedQuaternion.toArray())
    expect(proxy?.object.scale.toArray()).toEqual(expectedScale.toArray())
    proxy?.dispose()
  })
})
