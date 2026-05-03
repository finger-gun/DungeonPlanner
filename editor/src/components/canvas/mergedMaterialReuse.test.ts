import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import {
  buildMergedMaterialVariantSignature,
  disposeReusableMergedMaterialCache,
  getOrCreateReusableMergedMaterialRecord,
  reconcileReusableMergedMaterialRecords,
} from './mergedMaterialReuse'

describe('mergedMaterialReuse', () => {
  it('reuses the same base and depth materials for stable variants', () => {
    const cache = new Map()
    const sourceMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff' })
    const variantSignature = buildMergedMaterialVariantSignature({
      variant: 'floor',
      useBuildAnimation: false,
      useBakedLight: true,
      useBakedFlicker: false,
      useSecondaryDirectionAttribute: false,
      useGpuFog: true,
    })

    const first = getOrCreateReusableMergedMaterialRecord({
      cache,
      meshKey: 'mesh:1',
      sourceMaterial,
      variantSignature,
    })
    const second = getOrCreateReusableMergedMaterialRecord({
      cache,
      meshKey: 'mesh:1',
      sourceMaterial,
      variantSignature,
    })

    expect(second.material).toBe(first.material)
    expect(second.depthMaterial).toBe(first.depthMaterial)
  })

  it('drops stale variants when active material keys shrink', () => {
    const cache = new Map()
    const sourceMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff' })
    const staticRecord = getOrCreateReusableMergedMaterialRecord({
      cache,
      meshKey: 'mesh:1',
      sourceMaterial,
      variantSignature: 'static',
    })
    getOrCreateReusableMergedMaterialRecord({
      cache,
      meshKey: 'mesh:1',
      sourceMaterial,
      variantSignature: 'animated',
    })

    reconcileReusableMergedMaterialRecords(cache, new Set([staticRecord.cacheKey]))

    expect(cache.size).toBe(1)
    expect(cache.get(staticRecord.cacheKey)?.material).toBe(staticRecord.material)
  })

  it('clears the cache on teardown', () => {
    const cache = new Map()
    const sourceMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff' })

    getOrCreateReusableMergedMaterialRecord({
      cache,
      meshKey: 'mesh:1',
      sourceMaterial,
      variantSignature: 'static',
    })

    disposeReusableMergedMaterialCache(cache)

    expect(cache.size).toBe(0)
  })
})
