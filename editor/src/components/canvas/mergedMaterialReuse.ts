import * as THREE from 'three'
import { createCompatibleMaterialClone } from './batchedTileGeometry'

export type MergedMaterialVariantOptions = {
  variant: 'floor' | 'wall'
  useBuildAnimation: boolean
  useBakedLight: boolean
  useBakedFlicker: boolean
  useSecondaryDirectionAttribute: boolean
  useGpuFog: boolean
}

export type ReusableMergedMaterialRecord = {
  cacheKey: string
  sourceMaterial: THREE.Material
  variantSignature: string
  material: THREE.Material
  depthMaterial: THREE.MeshDepthMaterial
}

export function buildMergedMaterialVariantSignature({
  variant,
  useBuildAnimation,
  useBakedLight,
  useBakedFlicker,
  useSecondaryDirectionAttribute,
  useGpuFog,
}: MergedMaterialVariantOptions) {
  return [
    variant,
    useBuildAnimation ? 'animated' : 'static',
    useBakedLight ? 'baked' : 'unlit',
    useBakedFlicker ? 'flicker' : 'steady',
    useSecondaryDirectionAttribute ? 'double-direction' : 'single-direction',
    useGpuFog ? 'gpu-fog' : 'no-fog',
  ].join('|')
}

// ---------------------------------------------------------------------------
// Global material cache
//
// Keyed by `${sourceMaterial.uuid}|${meshKey}|${variantSignature}`.
// Materials are shared across ALL InstancedTileBucket instances for the same
// asset+variant combination.  This means:
//   • WebGPU compiles the pipeline exactly ONCE per variant (not once per
//     spatial chunk), so adding room B never triggers a pipeline stall for
//     asset types already used by room A.
//   • The prewarm controller warms the SAME material objects that real buckets
//     will use, so compileAsync actually benefits subsequent renders.
// Materials are never disposed (asset materials live for the app session).
// ---------------------------------------------------------------------------

const globalMaterialCache = new Map<string, ReusableMergedMaterialRecord>()

export function getOrCreateGlobalMaterialRecord({
  sourceMaterial,
  meshKey,
  variantSignature,
  lightFieldUUID,
}: {
  sourceMaterial: THREE.Material
  meshKey: string
  variantSignature: string
  /** UUID of the lightField texture, or undefined/null for unlit variants.
   *  Including this in the key prevents different rooms from fighting over
   *  the same material object with incompatible lightField textures, which
   *  would trigger needsUpdate=true on an actively-rendered material and
   *  cause the "Buffer used while destroyed" WebGPU error. */
  lightFieldUUID?: string | null
}): ReusableMergedMaterialRecord {
  const key = `${sourceMaterial.uuid}|${meshKey}|${variantSignature}|${lightFieldUUID ?? 'no-field'}`
  const existing = globalMaterialCache.get(key)
  if (existing) {
    return existing
  }

  const depthMaterial = new THREE.MeshDepthMaterial()
  depthMaterial.depthPacking = THREE.RGBADepthPacking
  const record: ReusableMergedMaterialRecord = {
    cacheKey: key,
    sourceMaterial,
    variantSignature,
    material: createCompatibleMaterialClone(sourceMaterial),
    depthMaterial,
  }
  globalMaterialCache.set(key, record)
  return record
}

/** Clears and disposes all globally cached materials. Primarily for testing. */
export function clearGlobalMaterialCache() {
  for (const record of globalMaterialCache.values()) {
    record.material.dispose()
    record.depthMaterial.dispose()
  }
  globalMaterialCache.clear()
}

// ---------------------------------------------------------------------------
// Per-component (local) material cache — kept for backward compatibility
// ---------------------------------------------------------------------------

export function getOrCreateReusableMergedMaterialRecord({
  cache,
  meshKey,
  sourceMaterial,
  variantSignature,
}: {
  cache: Map<string, ReusableMergedMaterialRecord>
  meshKey: string
  sourceMaterial: THREE.Material
  variantSignature: string
}) {
  const cacheKey = `${meshKey}|${variantSignature}`
  const existing = cache.get(cacheKey)
  if (existing && existing.sourceMaterial === sourceMaterial) {
    return existing
  }

  if (existing) {
    disposeReusableMergedMaterialRecord(existing)
  }

  const depthMaterial = new THREE.MeshDepthMaterial()
  depthMaterial.depthPacking = THREE.RGBADepthPacking
  const record: ReusableMergedMaterialRecord = {
    cacheKey,
    sourceMaterial,
    variantSignature,
    material: createCompatibleMaterialClone(sourceMaterial),
    depthMaterial,
  }
  cache.set(cacheKey, record)
  return record
}

export function reconcileReusableMergedMaterialRecords(
  cache: Map<string, ReusableMergedMaterialRecord>,
  activeKeys: Set<string>,
) {
  for (const [cacheKey, record] of cache) {
    if (activeKeys.has(cacheKey)) {
      continue
    }

    disposeReusableMergedMaterialRecord(record)
    cache.delete(cacheKey)
  }
}

export function disposeReusableMergedMaterialCache(
  cache: Map<string, ReusableMergedMaterialRecord>,
) {
  reconcileReusableMergedMaterialRecords(cache, new Set())
}

function disposeReusableMergedMaterialRecord(record: ReusableMergedMaterialRecord) {
  record.material.dispose()
  record.depthMaterial.dispose()
}
