import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildMergedTileGeometryMeshes } from './batchedTileGeometry'

describe('batchedTileGeometry', () => {
  it('preserves surface texture maps when cloning cached compatible materials', () => {
    const texture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
    texture.needsUpdate = true

    const material = new THREE.MeshStandardMaterial({ map: texture, color: '#ffffff' })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
    const sourceScene = new THREE.Group()
    sourceScene.add(mesh)

    const firstBuild = buildMergedTileGeometryMeshes({
      sourceScene,
      placements: [{ key: 'a', position: [0, 0, 0], rotation: [0, 0, 0] }],
    })
    const secondBuild = buildMergedTileGeometryMeshes({
      sourceScene,
      placements: [{ key: 'b', position: [1, 0, 0], rotation: [0, 0, 0] }],
    })

    expect((firstBuild[0]?.material as THREE.MeshStandardMaterial).map).toBe(texture)
    expect((secondBuild[0]?.material as THREE.MeshStandardMaterial).map).toBe(texture)
  })

  it('writes build animation attributes for merged placements', () => {
    const material = new THREE.MeshStandardMaterial({ color: '#ffffff' })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
    const sourceScene = new THREE.Group()
    sourceScene.add(mesh)

    const [merged] = buildMergedTileGeometryMeshes({
      sourceScene,
      placements: [
        {
          key: 'a',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          buildAnimationStart: 1000,
          buildAnimationDelay: 120,
        },
      ],
    })

    const buildStart = merged?.geometry.getAttribute('buildAnimationStart') as THREE.BufferAttribute | undefined
    const buildDelay = merged?.geometry.getAttribute('buildAnimationDelay') as THREE.BufferAttribute | undefined

    expect(buildStart).toBeDefined()
    expect(buildDelay).toBeDefined()
    expect(buildStart?.getX(0)).toBe(1000)
    expect(buildDelay?.getX(0)).toBe(120)
  })

  it('skips build animation attributes for static merged placements', () => {
    const material = new THREE.MeshStandardMaterial({ color: '#ffffff' })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
    const sourceScene = new THREE.Group()
    sourceScene.add(mesh)

    const [merged] = buildMergedTileGeometryMeshes({
      sourceScene,
      placements: [
        {
          key: 'a',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
        },
      ],
    })

    expect(merged?.geometry.getAttribute('buildAnimationStart')).toBeUndefined()
    expect(merged?.geometry.getAttribute('buildAnimationDelay')).toBeUndefined()
  })
})
