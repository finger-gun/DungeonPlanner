import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  cloneSceneWithNodeMaterials,
  cloneMaterialWithNodeCompatibility,
  createStandardCompatibleMaterial,
} from './nodeMaterialUtils'

describe('nodeMaterialUtils', () => {
  it('upgrades cloned scene mesh standard materials to node materials', () => {
    const material = new THREE.MeshStandardMaterial({
      color: '#7dd3fc',
      roughness: 0.34,
      metalness: 0.18,
    })
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)
    const scene = new THREE.Group()
    scene.add(mesh)

    const clonedScene = cloneSceneWithNodeMaterials(scene)
    const clonedMesh = clonedScene.children[0] as THREE.Mesh
    const clonedMaterial = clonedMesh.material as THREE.MeshStandardMaterial

    expect(clonedMaterial).not.toBe(material)
    expect(clonedMaterial.type).toBe('MeshStandardNodeMaterial')
    expect(clonedMaterial.color.getHexString()).toBe('7dd3fc')
    expect(clonedMaterial.roughness).toBeCloseTo(0.34)
    expect(clonedMaterial.metalness).toBeCloseTo(0.18)
    expect(material.type).toBe('MeshStandardMaterial')
  })

  it('leaves non-standard cloned scene materials untouched', () => {
    const material = new THREE.MeshBasicMaterial({ color: '#ffffff' })
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)
    const scene = new THREE.Group()
    scene.add(mesh)

    const clonedScene = cloneSceneWithNodeMaterials(scene)
    const clonedMesh = clonedScene.children[0] as THREE.Mesh

    expect(clonedMesh.material).toBe(material)
  })

  it('clones batched mesh standard materials as node materials', () => {
    const material = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      roughness: 0.52,
      metalness: 0.07,
    })

    const clonedMaterial = cloneMaterialWithNodeCompatibility(material) as THREE.MeshStandardMaterial

    expect(clonedMaterial).not.toBe(material)
    expect(clonedMaterial.type).toBe('MeshStandardNodeMaterial')
    expect(clonedMaterial.color.getHexString()).toBe('f59e0b')
    expect(clonedMaterial.roughness).toBeCloseTo(0.52)
    expect(clonedMaterial.metalness).toBeCloseTo(0.07)
  })

  it('creates node-compatible materials from standard material parameters', () => {
    const material = createStandardCompatibleMaterial({
      color: '#22c55e',
      roughness: 0.61,
      metalness: 0.11,
      transparent: true,
      opacity: 0.5,
    }) as THREE.MeshStandardMaterial

    expect(material.type).toBe('MeshStandardNodeMaterial')
    expect(material.color.getHexString()).toBe('22c55e')
    expect(material.roughness).toBeCloseTo(0.61)
    expect(material.metalness).toBeCloseTo(0.11)
    expect(material.transparent).toBe(true)
    expect(material.opacity).toBeCloseTo(0.5)
  })
})
