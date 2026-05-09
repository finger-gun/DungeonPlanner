import * as THREE from 'three'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import { applyBakedLightToSplineWallMaterialLibrary } from './splineWallBakedLight'
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
})
