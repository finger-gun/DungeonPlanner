import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createDoorSceneSetup } from './wall_doorway'

const DOOR_NODE_NAME = 'wall_doorway_door'

describe('wall_doorway', () => {
  it('remaps both the frame and door leaf to the selected atlas color cell', () => {
    const sourceScene = new THREE.Group()
    sourceScene.add(createUvMesh('frame'))
    sourceScene.add(createUvMesh(DOOR_NODE_NAME))

    const { baseScene, doorLeaf } = createDoorSceneSetup(sourceScene, [6, 0])
    const remappedFrame = baseScene.getObjectByName('frame')

    expect(remappedFrame).toBeInstanceOf(THREE.Mesh)
    expect(doorLeaf).toBeInstanceOf(THREE.Object3D)
    expect(baseScene.getObjectByName(DOOR_NODE_NAME)).toBeUndefined()

    expect(getFirstUv(remappedFrame as THREE.Mesh)).toEqual([0.75, 0])
    expect(getFirstUv(doorLeaf as THREE.Mesh)).toEqual([0.75, 0])
  })
})

function createUvMesh(name: string) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
  ]), 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([
    0.5, 0,
    0.625, 0,
    0.5, 0.25,
  ]), 2))

  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial())
  mesh.name = name
  return mesh
}

function getFirstUv(mesh: THREE.Mesh) {
  const uv = mesh.geometry.getAttribute('uv')
  if (!(uv instanceof THREE.BufferAttribute)) {
    throw new Error('Expected uv attribute')
  }

  return [uv.getX(0), uv.getY(0)]
}
