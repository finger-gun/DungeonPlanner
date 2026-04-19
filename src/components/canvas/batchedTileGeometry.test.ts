import * as THREE from 'three'
import { afterEach, describe, expect, it } from 'vitest'
import { buildMergedTileGeometryMeshes } from './batchedTileGeometry'

const resources: Array<THREE.BufferGeometry | THREE.Material> = []

afterEach(() => {
  resources.splice(0).forEach((resource) => resource.dispose())
})

describe('buildMergedTileGeometryMeshes', () => {
  it('merges repeated tile placements into one geometry per source mesh', () => {
    const sourceGeometry = new THREE.BoxGeometry(1, 1, 1)
    const sourceMaterial = new THREE.MeshStandardMaterial()
    resources.push(sourceGeometry, sourceMaterial)

    const scene = new THREE.Group()
    scene.add(new THREE.Mesh(sourceGeometry, sourceMaterial))

    const merged = buildMergedTileGeometryMeshes({
      sourceScene: scene,
      placements: [
        { key: 'a', position: [0, 0, 0], rotation: [0, 0, 0] },
        { key: 'b', position: [2, 0, 0], rotation: [0, 0, 0] },
      ],
    })

    expect(merged).toHaveLength(1)

    merged[0]!.geometry.computeBoundingBox()
    expect(merged[0]!.geometry.boundingBox?.min.toArray()).toEqual([-0.5, -0.5, -0.5])
    expect(merged[0]!.geometry.boundingBox?.max.toArray()).toEqual([2.5, 0.5, 0.5])

    merged[0]!.geometry.dispose()
  })

  it('applies authored asset transforms before merging placements', () => {
    const sourceGeometry = new THREE.BoxGeometry(1, 1, 1)
    const sourceMaterial = new THREE.MeshStandardMaterial()
    resources.push(sourceGeometry, sourceMaterial)

    const scene = new THREE.Group()
    scene.add(new THREE.Mesh(sourceGeometry, sourceMaterial))

    const merged = buildMergedTileGeometryMeshes({
      sourceScene: scene,
      placements: [
        { key: 'a', position: [0, 0, 0], rotation: [0, 0, 0] },
      ],
      transform: {
        position: [0, 1, 0],
      },
    })

    expect(merged).toHaveLength(1)

    merged[0]!.geometry.computeBoundingBox()
    expect(merged[0]!.geometry.boundingBox?.min.toArray()).toEqual([-0.5, 0.5, -0.5])
    expect(merged[0]!.geometry.boundingBox?.max.toArray()).toEqual([0.5, 1.5, 0.5])

    merged[0]!.geometry.dispose()
  })
})
