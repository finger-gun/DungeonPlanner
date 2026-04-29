import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import {
  createSelectionOutlineProxy,
  SELECTION_OUTLINE_IGNORE_USER_DATA,
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
})
