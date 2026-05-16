import * as THREE from 'three'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import { applyBakedLightToMaterial } from './bakedLightMaterial'
import type { SplineWallMaterialBundle, SplineWallMaterialPreset } from './splineWallMaterial'

export function applyBakedLightToSplineWallMaterialBundle(
  bundle: SplineWallMaterialBundle,
  bakedLightField: BakedFloorLightField | null,
  options: {
    useAttributeLight?: boolean
  } = {},
) {
  const shouldUseLightAttribute = Boolean(bakedLightField || options.useAttributeLight)
  applyBakedLightToMaterial(bundle.side, shouldUseLightAttribute
    ? {
        useLightAttribute: true,
        useDirectionAttribute: true,
        useDirectionalSampleOffset: false,
        ...(bakedLightField ? { lightField: bakedLightField } : {}),
      }
    : null)
  applyBakedLightToMaterial(bundle.top, shouldUseLightAttribute
    ? {
        useLightAttribute: true,
        useTopSurfaceMask: true,
        ...(bakedLightField ? { lightField: bakedLightField } : {}),
      }
    : null)
}

export function applyBakedLightToSplineWallMaterialLibrary(
  materials: Record<SplineWallMaterialPreset, SplineWallMaterialBundle>,
  bakedLightField: BakedFloorLightField | null,
  options: {
    useAttributeLight?: boolean
  } = {},
) {
  Object.values(materials).forEach((bundle) => {
    applyBakedLightToSplineWallMaterialBundle(bundle, bakedLightField, options)
  })
}

export function applyBakedLightToSplineWallStyleMaterial(
  material: THREE.Material,
  bakedLightField: BakedFloorLightField | null,
  options: {
    light?: readonly [number, number, number]
    lightDirection?: readonly [number, number, number]
    lightDirectionalStrength?: number
    useDirectionAttribute?: boolean
    useDirectionalFaceMask?: boolean
    useDirectionalSampleOffset?: boolean
  } = {},
) {
  applyBakedLightToMaterial(material, bakedLightField
    || options.light
    || options.useDirectionAttribute
    || options.useDirectionalFaceMask
    || options.useDirectionalSampleOffset !== undefined
    ? {
        useLightAttribute: true,
        ...(bakedLightField ? { lightField: bakedLightField } : {}),
        ...(options.light ? { light: options.light } : {}),
        ...(options.lightDirection ? { lightDirection: options.lightDirection } : {}),
        ...(options.lightDirectionalStrength !== undefined
          ? { lightDirectionalStrength: options.lightDirectionalStrength }
          : {}),
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
