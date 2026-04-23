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

  it('expands quantized attributes to float buffers for WebGPU-safe batching', () => {
    const sourceGeometry = new THREE.BufferGeometry()
    sourceGeometry.setAttribute(
      'position',
      new THREE.Int16BufferAttribute([
        -32767, 0, -32767,
        32767, 0, -32767,
        32767, 0, 32767,
      ], 3, true),
    )
    sourceGeometry.setAttribute(
      'normal',
      new THREE.Int8BufferAttribute([
        0, 127, 0,
        0, 127, 0,
        0, 127, 0,
      ], 3, true),
    )
    sourceGeometry.setIndex([0, 1, 2])

    const sourceMaterial = new THREE.MeshStandardMaterial()
    resources.push(sourceGeometry, sourceMaterial)

    const scene = new THREE.Group()
    scene.add(new THREE.Mesh(sourceGeometry, sourceMaterial))

    const merged = buildMergedTileGeometryMeshes({
      sourceScene: scene,
      placements: [{ key: 'a', position: [0, 0, 0], rotation: [0, 0, 0] }],
    })

    expect(merged).toHaveLength(1)
    expect(merged[0]!.geometry.getAttribute('position').array).toBeInstanceOf(Float32Array)
    expect(merged[0]!.geometry.getAttribute('position').normalized).toBe(false)
    expect(merged[0]!.geometry.getAttribute('normal').array).toBeInstanceOf(Float32Array)
    expect(merged[0]!.geometry.getAttribute('normal').normalized).toBe(false)

    merged[0]!.geometry.dispose()
  })

  it('keeps placement transforms when sanitizing quantized geometry', () => {
    const sourceGeometry = new THREE.BufferGeometry()
    sourceGeometry.setAttribute(
      'position',
      new THREE.Int16BufferAttribute([
        -32767, 0, -32767,
        32767, 0, -32767,
        32767, 0, 32767,
      ], 3, true),
    )
    sourceGeometry.setAttribute(
      'normal',
      new THREE.Int8BufferAttribute([
        0, 127, 0,
        0, 127, 0,
        0, 127, 0,
      ], 3, true),
    )
    sourceGeometry.setIndex([0, 1, 2])

    const sourceMaterial = new THREE.MeshStandardMaterial()
    resources.push(sourceGeometry, sourceMaterial)

    const scene = new THREE.Group()
    scene.add(new THREE.Mesh(sourceGeometry, sourceMaterial))

    const merged = buildMergedTileGeometryMeshes({
      sourceScene: scene,
      placements: [{ key: 'a', position: [2, 0, 0], rotation: [0, 0, 0] }],
    })

    expect(merged).toHaveLength(1)
    merged[0]!.geometry.computeBoundingBox()
    expect(merged[0]!.geometry.boundingBox!.min.x).toBeCloseTo(1)
    expect(merged[0]!.geometry.boundingBox!.max.x).toBeCloseTo(3)

    merged[0]!.geometry.dispose()
  })

  it('stamps per-placement fog cell coordinates into merged geometry attributes', () => {
    const sourceGeometry = new THREE.PlaneGeometry(1, 1)
    const sourceMaterial = new THREE.MeshStandardMaterial()
    resources.push(sourceGeometry, sourceMaterial)

    const scene = new THREE.Group()
    scene.add(new THREE.Mesh(sourceGeometry, sourceMaterial))

    const merged = buildMergedTileGeometryMeshes({
      sourceScene: scene,
      placements: [
        { key: 'a', position: [0, 0, 0], rotation: [0, 0, 0], fogCell: [3, 4] },
        { key: 'b', position: [2, 0, 0], rotation: [0, 0, 0], fogCell: [5, 6] },
      ],
    })

    expect(merged).toHaveLength(1)

    const fogCell = merged[0]!.geometry.getAttribute('fogCell')
    expect(fogCell).toBeInstanceOf(THREE.BufferAttribute)
    expect(fogCell.itemSize).toBe(2)

    const stampedPairs = new Set<string>()
    for (let index = 0; index < fogCell.count; index += 1) {
      stampedPairs.add(`${fogCell.getX(index)}:${fogCell.getY(index)}`)
    }

    expect(stampedPairs).toEqual(new Set(['3:4', '5:6']))

    merged[0]!.geometry.dispose()
  })
})
