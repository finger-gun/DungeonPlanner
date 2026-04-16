import * as THREE from 'three'
import { afterEach, describe, expect, it } from 'vitest'
import {
  clearDecalReceiverRegistry,
  getDecalReceiverMeshes,
  registerDecalReceivers,
  unregisterDecalReceivers,
} from './decalReceiverRegistry'

describe('decalReceiverRegistry', () => {
  afterEach(() => {
    clearDecalReceiverRegistry()
  })

  it('stores and returns registered receiver meshes', () => {
    const meshA = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())
    const meshB = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())

    registerDecalReceivers('floor:a', [meshA])
    registerDecalReceivers('floor:b', [meshB])

    expect(getDecalReceiverMeshes()).toEqual([meshA, meshB])
  })

  it('removes meshes when a receiver entry is unregistered', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())

    registerDecalReceivers('floor:a', [mesh])
    unregisterDecalReceivers('floor:a')

    expect(getDecalReceiverMeshes()).toEqual([])
  })
})
