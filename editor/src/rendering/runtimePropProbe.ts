import * as THREE from 'three'
import { buildPropBakedLightProbe, type BakedFloorLightField } from './dungeonLightField'

const rootInverseMatrixScratch = new THREE.Matrix4()
const childLocalMatrixScratch = new THREE.Matrix4()
const transformedCornerScratch = new THREE.Vector3()
const localBoundsCache = new Map<string, THREE.Box3>()

export function measureObjectLocalBounds(object: THREE.Object3D | null | undefined) {
  if (!object) {
    return null
  }

  object.updateWorldMatrix(true, true)
  const bounds = new THREE.Box3()
  let hasBounds = false
  rootInverseMatrixScratch.copy(object.matrixWorld).invert()

  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return
    }

    const geometry = child.geometry
    if (!geometry) {
      return
    }

    if (!geometry.boundingBox) {
      geometry.computeBoundingBox()
    }

    if (!geometry.boundingBox || geometry.boundingBox.isEmpty()) {
      return
    }

    child.updateWorldMatrix(true, false)
    const childBounds = geometry.boundingBox.clone()
    childLocalMatrixScratch.copy(rootInverseMatrixScratch).multiply(child.matrixWorld)
    childBounds.applyMatrix4(childLocalMatrixScratch)
    if (!hasBounds) {
      bounds.copy(childBounds)
      hasBounds = true
      return
    }

    bounds.union(childBounds)
  })

  return hasBounds ? bounds : null
}

export function getCachedObjectLocalBounds(
  cacheKey: string | null | undefined,
  object: THREE.Object3D | null | undefined,
) {
  if (!cacheKey) {
    return measureObjectLocalBounds(object)
  }

  if (localBoundsCache.has(cacheKey)) {
    return localBoundsCache.get(cacheKey) ?? null
  }

  const bounds = measureObjectLocalBounds(object)
  if (!bounds) {
    return null
  }

  const cachedBounds = bounds.clone()
  localBoundsCache.set(cacheKey, cachedBounds)
  return cachedBounds
}

export function clearCachedObjectLocalBounds() {
  localBoundsCache.clear()
}

export function measureObjectWorldBounds(
  object: THREE.Object3D | null | undefined,
  localBounds?: THREE.Box3 | null,
) {
  if (!object) {
    return null
  }

  const resolvedLocalBounds = localBounds ?? measureObjectLocalBounds(object)
  if (!resolvedLocalBounds || resolvedLocalBounds.isEmpty()) {
    return null
  }

  object.updateWorldMatrix(true, true)
  const bounds = new THREE.Box3()
  let hasBounds = false
  for (const x of [resolvedLocalBounds.min.x, resolvedLocalBounds.max.x]) {
    for (const y of [resolvedLocalBounds.min.y, resolvedLocalBounds.max.y]) {
      for (const z of [resolvedLocalBounds.min.z, resolvedLocalBounds.max.z]) {
        transformedCornerScratch.set(x, y, z).applyMatrix4(object.matrixWorld)
        if (!hasBounds) {
          bounds.set(transformedCornerScratch.clone(), transformedCornerScratch.clone())
          hasBounds = true
          continue
        }
        bounds.expandByPoint(transformedCornerScratch)
      }
    }
  }

  return hasBounds ? bounds : null
}

export function buildRuntimePropBakedLightProbe(
  lightField: BakedFloorLightField | null | undefined,
  object: THREE.Object3D | null | undefined,
  localBounds?: THREE.Box3 | null,
) {
  return buildPropBakedLightProbe(lightField, measureObjectWorldBounds(object, localBounds))
}
