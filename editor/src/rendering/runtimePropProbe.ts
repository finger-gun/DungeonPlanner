import * as THREE from 'three'
import { buildPropBakedLightProbe, type BakedFloorLightField } from './dungeonLightField'

export function measureObjectWorldBounds(object: THREE.Object3D | null | undefined) {
  if (!object) {
    return null
  }

  object.updateWorldMatrix(true, true)
  const bounds = new THREE.Box3().setFromObject(object)
  return bounds.isEmpty() ? null : bounds
}

export function buildRuntimePropBakedLightProbe(
  lightField: BakedFloorLightField | null | undefined,
  object: THREE.Object3D | null | undefined,
) {
  return buildPropBakedLightProbe(lightField, measureObjectWorldBounds(object))
}
