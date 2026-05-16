import * as THREE from 'three'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import { applyBakedLightToMaterial } from './bakedLightMaterial'
import type { SplineWallMaterialBundle, SplineWallMaterialPreset } from './splineWallMaterial'

export function applyBakedLightToSplineWallMaterialBundle(
  bundle: SplineWallMaterialBundle,
  bakedLightField: BakedFloorLightField | null,
) {
  applyBakedLightToMaterial(bundle.side, bakedLightField
    ? {
        useLightAttribute: true,
        lightField: bakedLightField,
      }
    : null)
  applyBakedLightToMaterial(bundle.top, bakedLightField
    ? {
        useLightAttribute: true,
        useTopSurfaceMask: true,
        lightField: bakedLightField,
      }
    : null)
}

export function applyBakedLightToSplineWallMaterialLibrary(
  materials: Record<SplineWallMaterialPreset, SplineWallMaterialBundle>,
  bakedLightField: BakedFloorLightField | null,
) {
  Object.values(materials).forEach((bundle) => {
    applyBakedLightToSplineWallMaterialBundle(bundle, bakedLightField)
  })
}

export function applyBakedLightToSplineWallStyleMaterial(
  material: THREE.Material,
  bakedLightField: BakedFloorLightField | null,
  options: {
    useDirectionAttribute?: boolean
    useDirectionalFaceMask?: boolean
    useDirectionalSampleOffset?: boolean
  } = {},
) {
  applyBakedLightToMaterial(material, bakedLightField
    ? {
        useLightAttribute: true,
        lightField: bakedLightField,
        ...(options.useDirectionAttribute !== undefined
          ? { useDirectionAttribute: options.useDirectionAttribute }
          : {}),
        ...(options.useDirectionalFaceMask !== undefined
          ? { useDirectionalFaceMask: options.useDirectionalFaceMask }
          : {}),
        ...(options.useDirectionalSampleOffset !== undefined
          ? { useDirectionalSampleOffset: options.useDirectionalSampleOffset }
          : {}),
      }
    : null)
}
