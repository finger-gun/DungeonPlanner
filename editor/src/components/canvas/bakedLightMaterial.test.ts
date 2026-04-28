import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createStandardCompatibleMaterial } from '../../rendering/nodeMaterialUtils'
import { applyBakedLightToMaterial, applyPropBakedLightToMaterial } from './bakedLightMaterial'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'

type TestNodeMaterial = THREE.Material & {
  isNodeMaterial?: boolean
  colorNode?: unknown
  emissiveNode?: unknown
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

    expect(material.userData.bakedLightSignature).toContain(lightField.lightFieldTexture!.uuid)
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

    expect(material.userData.propBakedLightSignature).toContain(lightField.lightFieldTexture!.uuid)
    expect(material.userData.propBakedLightSignature).not.toBe('off')
    expect(Object.prototype.hasOwnProperty.call(material.userData, 'propBakedLightBaseColorNode')).toBe(true)
    expect(material.colorNode).toBeDefined()
    expect(material.emissiveNode).toBeDefined()

    applyPropBakedLightToMaterial(material, null)

    expect(material.userData.propBakedLightSignature).toBe('off')
    expect(material.colorNode).toBe(material.userData.propBakedLightBaseColorNode)
    expect(material.emissiveNode).toBe(material.userData.propBakedLightBaseEmissiveNode ?? null)
  })
})
