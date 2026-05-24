import * as THREE from 'three'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import {
  applyBakedLightToSplineWallMaterialLibrary,
  applyBakedLightToSplineWallTopCapMaterial,
  applyBakedLightToSplineWallStyleMaterial,
} from './splineWallBakedLight'
import { applyBakedLightToMaterial } from './bakedLightMaterial'

vi.mock('./bakedLightMaterial', () => ({
  applyBakedLightToMaterial: vi.fn(),
}))

function createMaterialLibrary() {
  return {
    dungeon: {
      side: new THREE.MeshStandardMaterial(),
      top: new THREE.MeshStandardMaterial(),
    },
    cave: {
      side: new THREE.MeshStandardMaterial(),
      top: new THREE.MeshStandardMaterial(),
    },
    timber: {
      side: new THREE.MeshStandardMaterial(),
      top: new THREE.MeshStandardMaterial(),
    },
  }
}

describe('splineWallBakedLight', () => {
  beforeEach(() => {
    vi.mocked(applyBakedLightToMaterial).mockReset()
  })

  it('applies surface baked light to spline wall side and top materials', () => {
    const materials = createMaterialLibrary()
    const bakedLightField = {
      lightFieldTexture: null,
      flickerLightFieldTextures: [],
      lightFieldTextureSize: { width: 1, height: 1 },
      lightFieldGridSize: { widthCells: 1, heightCells: 1 },
      chunkSize: 1,
      bounds: null,
      gpuChunks: null,
    } as unknown as BakedFloorLightField

    applyBakedLightToSplineWallMaterialLibrary(materials, bakedLightField)

    expect(applyBakedLightToMaterial).toHaveBeenCalledWith(materials.dungeon.side, {
      useLightAttribute: true,
      useDirectionAttribute: true,
      useDirectionalSampleOffset: false,
      lightField: bakedLightField,
    })
    expect(applyBakedLightToMaterial).toHaveBeenCalledWith(materials.dungeon.top, {
      useLightAttribute: true,
      useTopSurfaceMask: true,
      lightField: bakedLightField,
    })
    expect(applyBakedLightToMaterial).toHaveBeenCalledTimes(6)
  })

  it('clears spline wall baked light when no field is available', () => {
    const materials = createMaterialLibrary()

    applyBakedLightToSplineWallMaterialLibrary(materials, null)

    expect(applyBakedLightToMaterial).toHaveBeenCalledWith(materials.dungeon.side, null)
    expect(applyBakedLightToMaterial).toHaveBeenCalledWith(materials.dungeon.top, null)
    expect(applyBakedLightToMaterial).toHaveBeenCalledTimes(6)
  })

  it('can keep bundle materials on attribute-driven wall probes without a shared field texture', () => {
    const materials = createMaterialLibrary()

    applyBakedLightToSplineWallMaterialLibrary(materials, null, {
      useAttributeLight: true,
    })

    expect(applyBakedLightToMaterial).toHaveBeenCalledWith(materials.dungeon.side, {
      useLightAttribute: true,
      useDirectionAttribute: true,
      useDirectionalSampleOffset: false,
    })
    expect(applyBakedLightToMaterial).toHaveBeenCalledWith(materials.dungeon.top, {
      useLightAttribute: true,
      useTopSurfaceMask: true,
    })
  })

  it('applies baked light to authored wall-style section materials', () => {
    const material = new THREE.MeshStandardMaterial()
    const bakedLightField = {
      lightFieldTexture: null,
      flickerLightFieldTextures: [],
      lightFieldTextureSize: { width: 1, height: 1 },
      lightFieldGridSize: { widthCells: 1, heightCells: 1 },
      chunkSize: 1,
      bounds: null,
      gpuChunks: null,
    } as unknown as BakedFloorLightField

    applyBakedLightToSplineWallStyleMaterial(material, bakedLightField)

    expect(applyBakedLightToMaterial).toHaveBeenCalledWith(material, {
      useLightAttribute: true,
      lightField: bakedLightField,
    })
  })

  it('passes directional baked light options to authored wall-style section materials', () => {
    const material = new THREE.MeshStandardMaterial()
    const bakedLightField = {
      lightFieldTexture: null,
      flickerLightFieldTextures: [],
      lightFieldTextureSize: { width: 1, height: 1 },
      lightFieldGridSize: { widthCells: 1, heightCells: 1 },
      chunkSize: 1,
      bounds: null,
      gpuChunks: null,
    } as unknown as BakedFloorLightField

    applyBakedLightToSplineWallStyleMaterial(material, bakedLightField, {
      useDirectionAttribute: true,
      useDirectionalFaceMask: true,
      useDirectionalSampleOffset: false,
    })

    expect(applyBakedLightToMaterial).toHaveBeenCalledWith(material, {
      useLightAttribute: true,
      useDirectionAttribute: true,
      useDirectionalFaceMask: true,
      useDirectionalSampleOffset: false,
      lightField: bakedLightField,
    })
  })

  it('can keep spline wall style lighting enabled with attribute-driven probes', () => {
    const material = new THREE.MeshStandardMaterial()

    applyBakedLightToSplineWallStyleMaterial(material, null, {
      useDirectionAttribute: true,
      useDirectionalFaceMask: true,
      useDirectionalSampleOffset: false,
    })

    expect(applyBakedLightToMaterial).toHaveBeenCalledWith(material, {
      useLightAttribute: true,
      useDirectionAttribute: true,
      useDirectionalFaceMask: true,
      useDirectionalSampleOffset: false,
    })
  })

  it('applies directional baked light to spline wall top-cap materials', () => {
    const material = new THREE.MeshStandardMaterial()
    const bakedLightField = {
      lightFieldTexture: null,
      flickerLightFieldTextures: [],
      lightFieldTextureSize: { width: 1, height: 1 },
      lightFieldGridSize: { widthCells: 1, heightCells: 1 },
      chunkSize: 1,
      bounds: null,
      gpuChunks: null,
    } as unknown as BakedFloorLightField

    applyBakedLightToSplineWallTopCapMaterial(material, bakedLightField)

    expect(applyBakedLightToMaterial).toHaveBeenCalledWith(material, {
      useLightAttribute: true,
      useDirectionAttribute: true,
      useDirectionalFaceMask: true,
      useDirectionalSampleOffset: false,
      lightField: bakedLightField,
    })
  })
})
