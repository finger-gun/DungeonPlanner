import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createStandardCompatibleMaterial } from '../../rendering/nodeMaterialUtils'
import { applyBakedLightToMaterial, applyPropBakedLightToMaterial } from './bakedLightMaterial'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import type { PropBakedLightProbe } from '../../rendering/dungeonLightField'

type TestNodeMaterial = THREE.Material & {
  isNodeMaterial?: boolean
  colorNode?: unknown
  emissiveNode?: unknown
  needsUpdate?: boolean
  userData: Record<string, unknown>
}

function createTestLightField(): BakedFloorLightField {
  const lightFieldTexture = new THREE.DataTexture(
    new Uint8Array([
      255, 180, 96, 255,
      255, 180, 96, 255,
      255, 180, 96, 255,
      255, 180, 96, 255,
    ]),
    2,
    2,
    THREE.RGBAFormat,
  )
  lightFieldTexture.needsUpdate = true

  return {
    floorId: 'floor-1',
    chunkSize: 8,
    bounds: {
      minCellX: 0,
      maxCellX: 1,
      minCellZ: 0,
      maxCellZ: 1,
    },
    staticLightSources: [],
    staticLightSourcesByChunkKey: {},
    occlusion: null,
    chunks: [],
    dirtyChunkKeys: [],
    dirtyChunkKeySet: new Set<string>(),
    lightFieldTexture,
    flickerLightFieldTextures: [null, null, null],
    lightFieldTextureSize: {
      width: 2,
      height: 2,
    },
    lightFieldGridSize: {
      widthCells: 1,
      heightCells: 1,
    },
    cornerSampleByKey: {},
    sampleByCellKey: {},
    previousSourceHash: null,
    sourceHash: 'field-hash-1',
  }
}

describe('bakedLightMaterial', () => {
  it('applies surface baked lighting from the shared field using explicit wall directions', () => {
    const material = createStandardCompatibleMaterial({
      color: '#ffffff',
      roughness: 0.4,
      metalness: 0.1,
    }) as TestNodeMaterial
    const lightField = createTestLightField()

    material.isNodeMaterial = true

    applyBakedLightToMaterial(material, {
      useLightAttribute: true,
      useDirectionAttribute: true,
      lightField,
      direction: [1, 0, 0],
    })

    expect(material.userData.bakedLightSignature).toContain('layout')
    expect(material.userData.bakedLightSignature).not.toContain(lightField.lightFieldTexture!.uuid)
    expect(material.userData.bakedLightSignature).toContain('directed-constant')
    expect(material.colorNode).toBeDefined()
    expect(material.emissiveNode).toBeDefined()

    applyBakedLightToMaterial(material, null)

    expect(material.userData.bakedLightSignature).toBe('off')
    expect(material.colorNode).toBe(material.userData.bakedLightBaseColorNode)
    expect(material.emissiveNode).toBe(material.userData.bakedLightBaseEmissiveNode ?? null)
  })

  it('applies prop baked lighting directly from the shared baked field texture', () => {
    const material = createStandardCompatibleMaterial({
      color: '#ffffff',
      roughness: 0.4,
      metalness: 0.1,
    }) as TestNodeMaterial
    const lightField = createTestLightField()

    material.isNodeMaterial = true

    applyPropBakedLightToMaterial(material, {
      lightField,
    })

    expect(material.userData.propBakedLightSignature).toContain('layout')
    expect(material.userData.propBakedLightSignature).not.toContain(lightField.lightFieldTexture!.uuid)
    expect(material.userData.propBakedLightSignature).not.toBe('off')
    expect(Object.prototype.hasOwnProperty.call(material.userData, 'propBakedLightBaseColorNode')).toBe(true)
    expect(material.colorNode).toBeDefined()
    expect(material.emissiveNode).toBeDefined()

    applyPropBakedLightToMaterial(material, null)

    expect(material.userData.propBakedLightSignature).toBe('off')
    expect(material.colorNode).toBe(material.userData.propBakedLightBaseColorNode)
    expect(material.emissiveNode).toBe(material.userData.propBakedLightBaseEmissiveNode ?? null)
  })

  it('stores runtime prop probe data in uniforms without recompiling the material on probe-only updates', () => {
    const material = createStandardCompatibleMaterial({
      color: '#ffffff',
      roughness: 0.4,
      metalness: 0.1,
    }) as TestNodeMaterial
    const lightField = createTestLightField()
    const probe: PropBakedLightProbe = {
      baseLight: [0.16, 0.08, 0.04],
      topLight: [0.22, 0.12, 0.06],
      baseY: 0.2,
      topY: 1.6,
      lightDirection: [1, 0, 0],
      directionalStrength: 0.58,
    }

    material.isNodeMaterial = true

    applyPropBakedLightToMaterial(material, {
      lightField,
      probe,
    })

    expect(material.userData.propBakedLightSignature).toContain('layout')
    expect(material.userData.propBakedLightSignature).not.toContain(lightField.lightFieldTexture!.uuid)
    expect(material.userData.propBakedLightSignature).toContain('probe-uniforms-v1')
    expect(material.userData.propBakedLightSignature).not.toContain('0.16,0.08,0.04')
    const uniformState = material.userData.propBakedLightUniformState as {
      baseLight: { value: THREE.Vector3 }
      topLight: { value: THREE.Vector3 }
      directionalStrength: { value: number }
      probeEnabled: { value: number }
    }
    expect(uniformState.baseLight.value.toArray()).toEqual([0.16, 0.08, 0.04])
    expect(uniformState.topLight.value.toArray()).toEqual([0.22, 0.12, 0.06])
    expect(uniformState.directionalStrength.value).toBeCloseTo(0.58)
    expect(uniformState.probeEnabled.value).toBe(1)
    expect(material.colorNode).toBeDefined()
    expect(material.emissiveNode).toBeDefined()

    const previousSignature = material.userData.propBakedLightSignature
    const previousColorNode = material.colorNode
    const previousEmissiveNode = material.emissiveNode

    applyPropBakedLightToMaterial(material, {
      lightField,
      probe: {
        ...probe,
        baseLight: [0.09, 0.04, 0.02],
        directionalStrength: 0.22,
      },
    })

    expect(material.userData.propBakedLightSignature).toBe(previousSignature)
    expect(material.colorNode).toBe(previousColorNode)
    expect(material.emissiveNode).toBe(previousEmissiveNode)
    expect(uniformState.baseLight.value.toArray()).toEqual([0.09, 0.04, 0.02])
    expect(uniformState.directionalStrength.value).toBeCloseTo(0.22)
  })

  it('keeps baked material signatures stable across light texture content updates with the same layout', () => {
    const material = createStandardCompatibleMaterial({
      color: '#ffffff',
      roughness: 0.4,
      metalness: 0.1,
    }) as TestNodeMaterial
    const lightField = createTestLightField()
    const updatedLightField = {
      ...createTestLightField(),
      previousSourceHash: lightField.sourceHash,
      sourceHash: 'field-hash-2',
    }

    material.isNodeMaterial = true

    applyBakedLightToMaterial(material, {
      useLightAttribute: true,
      useTopSurfaceMask: true,
      lightField,
    })

    const previousSignature = material.userData.bakedLightSignature
    const previousColorNode = material.colorNode
    material.needsUpdate = false

    applyBakedLightToMaterial(material, {
      useLightAttribute: true,
      useTopSurfaceMask: true,
      lightField: updatedLightField,
    })

    expect(material.userData.bakedLightSignature).toBe(previousSignature)
    expect(material.colorNode).toBe(previousColorNode)
    expect(material.needsUpdate).not.toBe(true)
  })
})
