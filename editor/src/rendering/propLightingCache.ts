import { useSyncExternalStore } from 'react'
import * as THREE from 'three'
import {
  buildPropBakedLightProbe,
  doesBoundsIntersectDirtyChunks,
  type BakedFloorLightField,
  type PropBakedLightProbe,
} from './dungeonLightField'
import { measureObjectWorldBounds } from './runtimePropProbe'

type CachedPropLightingEntry = {
  instanceKey: string
  sourceHash: string
  worldBounds: THREE.Box3 | null
  localBounds: THREE.Box3 | null
  probe: PropBakedLightProbe | null
}

const floorPropLightingCache = new Map<string, Map<string, CachedPropLightingEntry>>()
const listeners = new Set<() => void>()
let version = 0

export type RuntimePropLightingDebugEntry = {
  instanceKey: string
  worldBounds: THREE.Box3
  probe: PropBakedLightProbe
}

export function clearRuntimePropLightingCache() {
  floorPropLightingCache.clear()
  notifyCacheChanged()
}

export function pruneRuntimePropLightingCache(retainedFloorIds: Iterable<string>) {
  const retainedFloorIdSet = new Set(retainedFloorIds)
  let didPrune = false

  for (const floorId of floorPropLightingCache.keys()) {
    if (retainedFloorIdSet.has(floorId)) {
      continue
    }

    floorPropLightingCache.delete(floorId)
    didPrune = true
  }

  if (didPrune) {
    notifyCacheChanged()
  }
}

export function releaseCachedRuntimePropLightingProbe(
  floorId: string | null | undefined,
  instanceKey: string | null | undefined,
) {
  if (!floorId || !instanceKey) {
    return
  }

  const floorCache = floorPropLightingCache.get(floorId)
  if (!floorCache) {
    return
  }

  const removed = floorCache.delete(instanceKey)
  if (!removed) {
    return
  }
  if (floorCache.size === 0) {
    floorPropLightingCache.delete(floorId)
  }
  notifyCacheChanged()
}

export function getCachedRuntimePropBakedLightProbe({
  lightField,
  instanceKey,
  object,
  localBounds,
}: {
  lightField: BakedFloorLightField | null | undefined
  instanceKey?: string | null
  object: THREE.Object3D | null | undefined
  localBounds?: THREE.Box3 | null
}) {
  const worldBounds = measureObjectWorldBounds(object, localBounds)
  if (!lightField || !instanceKey) {
    return buildPropBakedLightProbe(lightField, worldBounds)
  }

  const floorCache = getOrCreateFloorPropLightingCache(lightField.floorId)
  const cachedEntry = floorCache.get(instanceKey)
  if (
    cachedEntry
    && cachedEntry.sourceHash === lightField.sourceHash
    && areBox3Equal(cachedEntry.worldBounds, worldBounds)
    && areBox3Equal(cachedEntry.localBounds, localBounds ?? null)
  ) {
    return cachedEntry.probe
  }

  if (
    cachedEntry
    && cachedEntry.sourceHash === lightField.previousSourceHash
    && areBox3Equal(cachedEntry.worldBounds, worldBounds)
    && areBox3Equal(cachedEntry.localBounds, localBounds ?? null)
    && !doesBoundsIntersectDirtyChunks(lightField, worldBounds)
  ) {
    cachedEntry.sourceHash = lightField.sourceHash
    return cachedEntry.probe
  }

  const probe = buildPropBakedLightProbe(lightField, worldBounds)
  floorCache.set(instanceKey, {
    instanceKey,
    sourceHash: lightField.sourceHash,
    worldBounds: worldBounds ? worldBounds.clone() : null,
    localBounds: localBounds ? localBounds.clone() : null,
    probe,
  })
  notifyCacheChanged()
  return probe
}

export function getRuntimePropLightingDebugEntries(floorId: string) {
  const floorCache = floorPropLightingCache.get(floorId)
  if (!floorCache) {
    return []
  }

  return [...floorCache.values()]
    .filter((entry): entry is CachedPropLightingEntry & { worldBounds: THREE.Box3, probe: PropBakedLightProbe } =>
      Boolean(entry.worldBounds && entry.probe),
    )
    .map((entry) => ({
      instanceKey: entry.instanceKey,
      worldBounds: entry.worldBounds.clone(),
      probe: {
        ...entry.probe,
        baseLight: [...entry.probe.baseLight] as [number, number, number],
        topLight: [...entry.probe.topLight] as [number, number, number],
        lightDirection: [...entry.probe.lightDirection] as [number, number, number],
      },
    } satisfies RuntimePropLightingDebugEntry))
}

export function useRuntimePropLightingCacheVersion() {
  return useSyncExternalStore(subscribeToRuntimePropLightingCache, getRuntimePropLightingCacheVersion)
}

function getOrCreateFloorPropLightingCache(floorId: string) {
  let floorCache = floorPropLightingCache.get(floorId)
  if (!floorCache) {
    floorCache = new Map<string, CachedPropLightingEntry>()
    floorPropLightingCache.set(floorId, floorCache)
  }
  return floorCache
}

function notifyCacheChanged() {
  version += 1
  listeners.forEach((listener) => listener())
}

function subscribeToRuntimePropLightingCache(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getRuntimePropLightingCacheVersion() {
  return version
}

function areBox3Equal(left: THREE.Box3 | null | undefined, right: THREE.Box3 | null | undefined) {
  if (!left || !right) {
    return left === right
  }

  return left.min.equals(right.min) && left.max.equals(right.max)
}
