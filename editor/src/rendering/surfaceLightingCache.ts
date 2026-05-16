import * as THREE from 'three'
import {
  buildSurfaceBakedLightProbe,
  doesBoundsIntersectDirtyChunks,
  type BakedFloorLightField,
  type SurfaceBakedLightProbe,
} from './dungeonLightField'

type CachedSurfaceLightingEntry = {
  instanceKey: string
  sourceHash: string
  worldBounds: THREE.Box3 | null
  sampleKey: string
  probe: SurfaceBakedLightProbe | null
}

const floorSurfaceLightingCache = new Map<string, Map<string, CachedSurfaceLightingEntry>>()

export function releaseCachedRuntimeSurfaceLightingProbe(
  floorId: string | null | undefined,
  instanceKey: string | null | undefined,
) {
  if (!floorId || !instanceKey) {
    return
  }

  const floorCache = floorSurfaceLightingCache.get(floorId)
  if (!floorCache) {
    return
  }

  floorCache.delete(instanceKey)
  if (floorCache.size === 0) {
    floorSurfaceLightingCache.delete(floorId)
  }
}

export function getCachedRuntimeSurfaceLightProbe({
  lightField,
  instanceKey,
  samplePositions,
  worldBounds,
}: {
  lightField: BakedFloorLightField | null | undefined
  instanceKey?: string | null
  samplePositions: readonly (readonly [number, number, number])[]
  worldBounds?: THREE.Box3 | null
}) {
  if (!lightField || samplePositions.length === 0) {
    return null
  }

  if (!instanceKey) {
    return buildSurfaceBakedLightProbe(lightField, samplePositions)
  }

  const floorCache = getOrCreateFloorSurfaceLightingCache(lightField.floorId)
  const sampleKey = buildSurfaceSampleKey(samplePositions)
  const resolvedWorldBounds = worldBounds ?? buildWorldBoundsForSamplePositions(samplePositions)
  const cachedEntry = floorCache.get(instanceKey)

  if (
    cachedEntry
    && cachedEntry.sourceHash === lightField.sourceHash
    && cachedEntry.sampleKey === sampleKey
    && areBox3Equal(cachedEntry.worldBounds, resolvedWorldBounds)
  ) {
    return cachedEntry.probe
  }

  if (
    cachedEntry
    && cachedEntry.sourceHash === lightField.previousSourceHash
    && cachedEntry.sampleKey === sampleKey
    && areBox3Equal(cachedEntry.worldBounds, resolvedWorldBounds)
    && !doesBoundsIntersectDirtyChunks(lightField, resolvedWorldBounds)
  ) {
    cachedEntry.sourceHash = lightField.sourceHash
    return cachedEntry.probe
  }

  const probe = buildSurfaceBakedLightProbe(lightField, samplePositions)
  floorCache.set(instanceKey, {
    instanceKey,
    sourceHash: lightField.sourceHash,
    worldBounds: resolvedWorldBounds ? resolvedWorldBounds.clone() : null,
    sampleKey,
    probe,
  })
  return probe
}

function getOrCreateFloorSurfaceLightingCache(floorId: string) {
  let floorCache = floorSurfaceLightingCache.get(floorId)
  if (!floorCache) {
    floorCache = new Map<string, CachedSurfaceLightingEntry>()
    floorSurfaceLightingCache.set(floorId, floorCache)
  }
  return floorCache
}

function buildSurfaceSampleKey(samplePositions: readonly (readonly [number, number, number])[]) {
  return samplePositions
    .map((position) => position.map((value) => value.toFixed(4)).join(','))
    .join('|')
}

function buildWorldBoundsForSamplePositions(samplePositions: readonly (readonly [number, number, number])[]) {
  if (samplePositions.length === 0) {
    return null
  }

  const bounds = new THREE.Box3()
  samplePositions.forEach((position, index) => {
    const point = new THREE.Vector3(position[0], position[1], position[2])
    if (index === 0) {
      bounds.set(point.clone(), point.clone())
      return
    }
    bounds.expandByPoint(point)
  })
  bounds.expandByScalar(0.5)
  return bounds
}

function areBox3Equal(left: THREE.Box3 | null | undefined, right: THREE.Box3 | null | undefined) {
  if (!left || !right) {
    return left === right
  }

  return left.min.equals(right.min) && left.max.equals(right.max)
}
