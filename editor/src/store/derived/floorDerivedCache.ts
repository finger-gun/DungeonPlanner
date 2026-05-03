import type { FloorDirtyInfo } from '../floorDirtyDomains'
import {
  buildBakedLightBuildInput,
  buildFloorDerivedBundle,
  buildFloorSceneDerivedBundle,
  buildFloorWallOpeningDerivedState,
  buildObjectHierarchy,
  buildStaticLightSources,
  buildVisibleObjects,
  buildVisibleOpenings,
  buildVisiblePaintedCells,
  type DungeonRoomData,
  type FloorDerivedBundle,
  type FloorSceneDerivedBundle,
} from './floorDerived'

type CacheValue<T> = {
  key: string
  value: T
}

type FloorDerivedCacheEntry = {
  data?: CacheValue<DungeonRoomData>
  visiblePainted?: CacheValue<Pick<FloorDerivedBundle, 'visiblePaintedCells' | 'visiblePaintedCellRecords'>>
  visibleObjects?: CacheValue<FloorDerivedBundle['visibleObjects']>
  visibleOpenings?: CacheValue<FloorDerivedBundle['visibleOpenings']>
  staticLightSources?: CacheValue<FloorDerivedBundle['staticLightSources']>
  objectHierarchy?: CacheValue<Pick<FloorDerivedBundle, 'topLevelObjects' | 'childrenByParent'>>
  bakedLightBuildInput?: CacheValue<FloorDerivedBundle['bakedLightBuildInput']>
  wallOpeningDerivedState?: CacheValue<FloorDerivedBundle['wallOpeningDerivedState']>
  sceneBundle?: CacheValue<FloorSceneDerivedBundle>
  bundle?: CacheValue<FloorDerivedBundle>
}

const floorDerivedCache = new Map<string, FloorDerivedCacheEntry>()
const derivedIdentityCache = new WeakMap<object, number>()
let nextDerivedIdentity = 1

export function clearFloorDerivedCache() {
  floorDerivedCache.clear()
  nextDerivedIdentity = 1
}

export function getOrBuildCachedFloorDerivedBundle({
  data,
  dirtyInfo,
}: {
  data: DungeonRoomData
  dirtyInfo?: FloorDirtyInfo | null
}): FloorDerivedBundle {
  const cacheEntry = getFloorDerivedCacheEntry(data.floorId)
  const cachedData = getOrBuildCachedValue(
    cacheEntry,
    'data',
    buildDataCacheKey(data),
    () => data,
  )
  const visiblePainted = getOrBuildCachedValue(
    cacheEntry,
    'visiblePainted',
    [
      buildVersionToken(dirtyInfo, 'tilesVersion', cachedData.paintedCells),
      buildVersionToken(dirtyInfo, 'layerVisibilityVersion', cachedData.layers),
    ].join('|'),
    () => buildVisiblePaintedCells(cachedData),
  )
  const visibleObjects = getOrBuildCachedValue(
    cacheEntry,
    'visibleObjects',
    [
      buildVersionToken(dirtyInfo, 'propsVersion', cachedData.placedObjects),
      buildVersionToken(dirtyInfo, 'layerVisibilityVersion', cachedData.layers),
    ].join('|'),
    () => buildVisibleObjects(cachedData),
  )
  const visibleOpenings = getOrBuildCachedValue(
    cacheEntry,
    'visibleOpenings',
    [
      buildVersionToken(dirtyInfo, 'openingsVersion', cachedData.wallOpenings),
      buildVersionToken(dirtyInfo, 'layerVisibilityVersion', cachedData.layers),
    ].join('|'),
    () => buildVisibleOpenings(cachedData),
  )
  const staticLightSources = getOrBuildCachedValue(
    cacheEntry,
    'staticLightSources',
    `objects:${getDerivedIdentity(visibleObjects)}`,
    () => buildStaticLightSources(visibleObjects),
  )
  const objectHierarchy = getOrBuildCachedValue(
    cacheEntry,
    'objectHierarchy',
    `objects:${getDerivedIdentity(visibleObjects)}`,
    () => buildObjectHierarchy(visibleObjects),
  )
  const wallOpeningDerivedState = getOrBuildCachedValue(
    cacheEntry,
    'wallOpeningDerivedState',
    buildVersionToken(dirtyInfo, 'openingsVersion', cachedData.wallOpenings),
    () => buildFloorWallOpeningDerivedState(cachedData),
  )
  const bakedLightBuildInput = getOrBuildCachedValue(
    cacheEntry,
    'bakedLightBuildInput',
    [
      `painted:${getDerivedIdentity(visiblePainted.visiblePaintedCells)}`,
      `painted-records:${getDerivedIdentity(visiblePainted.visiblePaintedCellRecords)}`,
      `lights:${getDerivedIdentity(staticLightSources)}`,
      buildVersionToken(dirtyInfo, 'openingsVersion', cachedData.wallOpenings),
      buildVersionToken(dirtyInfo, 'wallsVersion', cachedData.innerWalls),
      buildVersionToken(dirtyInfo, 'lightingVersion', cachedData.wallSurfaceProps),
      buildDirtyHintToken(dirtyInfo),
    ].join('|'),
    () => buildBakedLightBuildInput(
      cachedData,
      visiblePainted.visiblePaintedCells,
      visiblePainted.visiblePaintedCellRecords,
      staticLightSources,
      dirtyInfo,
    ),
  )

  return getOrBuildCachedValue(
    cacheEntry,
    'bundle',
    [
      `data:${getDerivedIdentity(cachedData)}`,
      `painted:${getDerivedIdentity(visiblePainted.visiblePaintedCells)}`,
      `painted-records:${getDerivedIdentity(visiblePainted.visiblePaintedCellRecords)}`,
      `objects:${getDerivedIdentity(visibleObjects)}`,
      `openings:${getDerivedIdentity(visibleOpenings)}`,
      `lights:${getDerivedIdentity(staticLightSources)}`,
      `hierarchy:${getDerivedIdentity(objectHierarchy.childrenByParent)}`,
      `top-level:${getDerivedIdentity(objectHierarchy.topLevelObjects)}`,
      `light-input:${getDerivedIdentity(bakedLightBuildInput)}`,
      `wall-openings:${getDerivedIdentity(wallOpeningDerivedState)}`,
    ].join('|'),
    () => ({
      data: cachedData,
      ...visiblePainted,
      visibleObjects,
      visibleOpenings,
      staticLightSources,
      ...objectHierarchy,
      bakedLightBuildInput,
      wallOpeningDerivedState,
    }),
  )
}

export function getOrBuildCachedFloorSceneDerivedBundle({
  data,
  dirtyInfo,
}: {
  data: DungeonRoomData
  dirtyInfo?: FloorDirtyInfo | null
}): FloorSceneDerivedBundle {
  const cacheEntry = getFloorDerivedCacheEntry(data.floorId)
  const cachedData = getOrBuildCachedValue(
    cacheEntry,
    'data',
    buildDataCacheKey(data),
    () => data,
  )
  const visiblePainted = getOrBuildCachedValue(
    cacheEntry,
    'visiblePainted',
    [
      buildVersionToken(dirtyInfo, 'tilesVersion', cachedData.paintedCells),
      buildVersionToken(dirtyInfo, 'layerVisibilityVersion', cachedData.layers),
    ].join('|'),
    () => buildVisiblePaintedCells(cachedData),
  )
  const visibleObjects = getOrBuildCachedValue(
    cacheEntry,
    'visibleObjects',
    [
      buildVersionToken(dirtyInfo, 'propsVersion', cachedData.placedObjects),
      buildVersionToken(dirtyInfo, 'layerVisibilityVersion', cachedData.layers),
    ].join('|'),
    () => buildVisibleObjects(cachedData),
  )
  const staticLightSources = getOrBuildCachedValue(
    cacheEntry,
    'staticLightSources',
    `objects:${getDerivedIdentity(visibleObjects)}`,
    () => buildStaticLightSources(visibleObjects),
  )
  const objectHierarchy = getOrBuildCachedValue(
    cacheEntry,
    'objectHierarchy',
    `objects:${getDerivedIdentity(visibleObjects)}`,
    () => buildObjectHierarchy(visibleObjects),
  )
  const bakedLightBuildInput = getOrBuildCachedValue(
    cacheEntry,
    'bakedLightBuildInput',
    [
      `painted:${getDerivedIdentity(visiblePainted.visiblePaintedCells)}`,
      `painted-records:${getDerivedIdentity(visiblePainted.visiblePaintedCellRecords)}`,
      `lights:${getDerivedIdentity(staticLightSources)}`,
      buildVersionToken(dirtyInfo, 'openingsVersion', cachedData.wallOpenings),
      buildVersionToken(dirtyInfo, 'wallsVersion', cachedData.innerWalls),
      buildVersionToken(dirtyInfo, 'lightingVersion', cachedData.wallSurfaceProps),
      buildDirtyHintToken(dirtyInfo),
    ].join('|'),
    () => buildBakedLightBuildInput(
      cachedData,
      visiblePainted.visiblePaintedCells,
      visiblePainted.visiblePaintedCellRecords,
      staticLightSources,
      dirtyInfo,
    ),
  )

  return getOrBuildCachedValue(
    cacheEntry,
    'sceneBundle',
    [
      `data:${getDerivedIdentity(cachedData)}`,
      `hierarchy:${getDerivedIdentity(objectHierarchy.childrenByParent)}`,
      `top-level:${getDerivedIdentity(objectHierarchy.topLevelObjects)}`,
      `light-input:${getDerivedIdentity(bakedLightBuildInput)}`,
    ].join('|'),
    () => ({
      data: cachedData,
      ...objectHierarchy,
      bakedLightBuildInput,
    }),
  )
}

function getFloorDerivedCacheEntry(floorId: string) {
  const cached = floorDerivedCache.get(floorId)
  if (cached) {
    return cached
  }

  const created: FloorDerivedCacheEntry = {}
  floorDerivedCache.set(floorId, created)
  return created
}

function getOrBuildCachedValue<TKey extends keyof FloorDerivedCacheEntry, TValue>(
  entry: FloorDerivedCacheEntry,
  slot: TKey,
  key: string,
  build: () => TValue,
) {
  const cached = entry[slot] as CacheValue<TValue> | undefined
  if (cached?.key === key) {
    return cached.value
  }

  const value = build()
  entry[slot] = { key, value } as FloorDerivedCacheEntry[TKey]
  return value
}

function buildDataCacheKey(data: DungeonRoomData) {
  return [
    data.floorId,
    `painted:${getDerivedIdentity(data.paintedCells)}`,
    `layers:${getDerivedIdentity(data.layers)}`,
    `rooms:${getDerivedIdentity(data.rooms)}`,
    `openings:${getDerivedIdentity(data.wallOpenings)}`,
    `walls:${getDerivedIdentity(data.innerWalls)}`,
    `objects:${getDerivedIdentity(data.placedObjects)}`,
    `floor-assets:${getDerivedIdentity(data.floorTileAssetIds)}`,
    `wall-assets:${getDerivedIdentity(data.wallSurfaceAssetIds)}`,
    `wall-props:${getDerivedIdentity(data.wallSurfaceProps)}`,
    `global-floor:${data.globalFloorAssetId ?? 'none'}`,
    `global-wall:${data.globalWallAssetId ?? 'none'}`,
  ].join('|')
}

function buildVersionToken(
  dirtyInfo: FloorDirtyInfo | null | undefined,
  versionKey: keyof Pick<
    FloorDirtyInfo,
    'tilesVersion' | 'propsVersion' | 'openingsVersion' | 'wallsVersion' | 'lightingVersion' | 'layerVisibilityVersion'
  >,
  value: object,
) {
  return dirtyInfo
    ? `${versionKey}:${dirtyInfo[versionKey]}`
    : `${versionKey}:ref-${getDerivedIdentity(value)}`
}

function buildDirtyHintToken(dirtyInfo: FloorDirtyInfo | null | undefined) {
  if (!dirtyInfo) {
    return 'dirty:none'
  }

  const dirtyRect = dirtyInfo.dirtyCellRect
    ? [
        dirtyInfo.dirtyCellRect.minCellX,
        dirtyInfo.dirtyCellRect.maxCellX,
        dirtyInfo.dirtyCellRect.minCellZ,
        dirtyInfo.dirtyCellRect.maxCellZ,
      ].join(':')
    : 'none'

  return [
    `sequence:${dirtyInfo.sequence}`,
    `rect:${dirtyRect}`,
    `walls:${dirtyInfo.dirtyWallKeys.join(',')}`,
    `objects:${dirtyInfo.affectedObjectIds.join(',')}`,
    `full:${dirtyInfo.fullRefresh ? 1 : 0}`,
  ].join('|')
}

function getDerivedIdentity(value: object) {
  const cached = derivedIdentityCache.get(value)
  if (cached) {
    return cached
  }

  const identity = nextDerivedIdentity
  nextDerivedIdentity += 1
  derivedIdentityCache.set(value, identity)
  return identity
}

export function buildFloorDerivedBundleWithCache(data: DungeonRoomData) {
  return getOrBuildCachedFloorDerivedBundle({ data, dirtyInfo: null })
}

export function buildUncachedFloorDerivedBundle(data: DungeonRoomData) {
  return buildFloorDerivedBundle(data)
}

export function buildFloorSceneDerivedBundleWithCache(data: DungeonRoomData) {
  return getOrBuildCachedFloorSceneDerivedBundle({ data, dirtyInfo: null })
}

export function buildUncachedFloorSceneDerivedBundle(data: DungeonRoomData) {
  return buildFloorSceneDerivedBundle(data)
}
