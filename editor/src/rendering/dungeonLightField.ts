import * as THREE from 'three'
import { getContentPackAssetById } from '../content-packs/registry'
import type { PropLight } from '../content-packs/types'
import { cellToWorldPosition, getCellKey, GRID_SIZE, type GridCell } from '../hooks/useSnapToGrid'
import type { RegisteredLightSource } from '../components/canvas/objectSourceRegistry'
import type {
  DungeonObjectRecord,
  InnerWallRecord,
  OpeningRecord,
  PaintedCells,
} from '../store/useDungeonStore'
import type { FloorDirtyInfo, FloorDirtyRect } from '../store/floorDirtyDomains'
import type { ObjectLightOverrides } from '../store/lightOverrides'
import { getObjectLightOverrides, mergePropLightWithOverrides } from '../store/lightOverrides'
import { DEFAULT_FLOOR_CHUNK_SIZE } from '../store/floorChunkKeys'
import { buildOpenWallSegmentSet } from '../store/openWallSegments'
import { getMirroredWallKey } from '../store/manualWalls'
import { collectBoundaryWallSegments } from '../store/wallSegments'
import { doesLineIntersectClosedWall, isCornerBlockedBySolidWall } from './dungeonLightFieldOcclusion'
import {
  BAKED_FLICKER_COEFFICIENT_SCALE,
  getStableLightFlickerCoefficients,
} from './lightFlickerMath'

export const DEFAULT_BAKED_LIGHT_CHUNK_SIZE = DEFAULT_FLOOR_CHUNK_SIZE
export const DEFAULT_DYNAMIC_LIGHT_POOL_SIZE = 32
export const DEFAULT_BAKED_LIGHT_CHANNEL_CAP = 0.9
const BAKED_LIGHT_FIELD_SIGNATURE_VERSION = 'multi-basis-flicker-v2'
const BAKED_LIGHT_CHUNK_HALO = 1
const BAKED_LIGHT_DISTANCE_SCALE = 1.18
const BAKED_LIGHT_NEAR_FIELD_BOOST = 0.42
const BAKED_LIGHT_NEAR_FIELD_FRACTION = 0.38
const PROP_BAKED_LIGHT_MULTIPLIER = 1.45
const PROP_BAKED_TOP_LIGHT_MULTIPLIER = 1.65

const ZERO_BAKED_LIGHT_SAMPLE = [0, 0, 0] as const
const positionScratch = new THREE.Vector3()
const offsetScratch = new THREE.Vector3()
const rotationScratch = new THREE.Euler()
const sphereScratch = new THREE.Sphere()
const colorScratch = new THREE.Color()
const directionalLightVectorScratch = new THREE.Vector3()
const directionalLightContributionScratch = new THREE.Vector3()
const floorLightFieldCache = new Map<string, BakedFloorLightField>()
const bakedLightOcclusionCache = new Map<string, BakedLightOcclusion | null>()
const bakedLightSourceHashCache = new Map<string, string>()
const derivedObjectIdentityCache = new WeakMap<object, number>()
let nextDerivedObjectIdentity = 1

export type BakedLightSample = readonly [number, number, number]
export type BakedLightCornerSample = readonly [number, number, number]
export type BakedLightOcclusionInput = {
  paintedCells: PaintedCells
  wallOpenings: Record<string, OpeningRecord>
  innerWalls: Record<string, InnerWallRecord>
  wallSurfaceProps?: Record<string, Record<string, unknown>>
}

export type BakedLightOcclusion = {
  paintedCells: PaintedCells
  openWalls: Set<string>
  solidWalls: Set<string>
  cornerBlockingWalls: Set<string>
}

export type PropBakedLightProbe = {
  baseLight: BakedLightSample
  topLight: BakedLightSample
  baseY: number
  topY: number
  lightDirection: readonly [number, number, number]
  directionalStrength: number
}

export type ResolvedDungeonLightSource = {
  key: string
  object: DungeonObjectRecord
  light: PropLight
  position: [number, number, number]
  linearColor: [number, number, number]
}

export type BakedLightChunk = {
  key: string
  chunkX: number
  chunkZ: number
  minCellX: number
  maxCellX: number
  minCellZ: number
  maxCellZ: number
  cellKeys: string[]
  dirty: boolean
}

export type BakedFloorLightField = {
  floorId: string
  chunkSize: number
  bounds: {
    minCellX: number
    maxCellX: number
    minCellZ: number
    maxCellZ: number
  } | null
  staticLightSources: ResolvedDungeonLightSource[]
  staticLightSourcesByChunkKey: Record<string, ResolvedDungeonLightSource[]>
  occlusion: BakedLightOcclusion | null
  chunks: BakedLightChunk[]
  dirtyChunkKeys: string[]
  dirtyChunkKeySet: ReadonlySet<string>
  lightFieldTexture: BakedLightFieldTexture | null
  flickerLightFieldTextures: [
    BakedLightFieldTexture | null,
    BakedLightFieldTexture | null,
    BakedLightFieldTexture | null,
  ]
  gpuChunks: BakedFloorLightFieldGpuChunks | null
  lightFieldTextureSize: {
    width: number
    height: number
  }
  lightFieldGridSize: {
    widthCells: number
    heightCells: number
  }
  cornerSampleByKey: Record<string, BakedLightCornerSample>
  sampleByCellKey: Record<string, BakedLightSample>
  previousSourceHash: string | null
  sourceHash: string
}

export type BakedLightFieldTexture = THREE.DataTexture | THREE.DataArrayTexture

export type BakedFloorLightFieldGpuChunks = {
  lookupBounds: {
    minChunkX: number
    maxChunkX: number
    minChunkZ: number
    maxChunkZ: number
  } | null
  lookupTexture: THREE.DataTexture | null
  lookupSize: {
    width: number
    height: number
  }
  textureSize: {
    width: number
    height: number
  }
  gridSize: {
    widthCells: number
    heightCells: number
  }
  layerByChunkKey: Record<string, number>
}

type BakedFloorLightFieldLayout = {
  bounds: BakedFloorLightField['bounds']
  chunks: Array<Omit<BakedLightChunk, 'dirty'>>
  effectiveDirtyChunkKeys: Set<string>
  uniqueCellKeys: Set<string>
  staticLightSourcesByChunkKey: Record<string, ResolvedDungeonLightSource[]>
  flickerStaticLightSources: ResolvedDungeonLightSource[]
}

type PreparedBakedLightFieldTextures = Pick<
  BakedFloorLightField,
  'lightFieldTexture' | 'flickerLightFieldTextures' | 'lightFieldTextureSize' | 'lightFieldGridSize' | 'gpuChunks'
> & {
  textureLayoutChanged: boolean
}

export type BakedFloorLightFieldBuildInput = {
  floorId: string
  floorCells: GridCell[]
  staticLightSources: ResolvedDungeonLightSource[]
  occlusionInput?: BakedLightOcclusionInput | null
  dirtyHint?: Pick<
    FloorDirtyInfo,
    | 'sequence'
    | 'dirtyCellRect'
    | 'dirtyCellKeys'
    | 'dirtyChunkKeys'
    | 'dirtyLightChunkKeys'
    | 'dirtyWallKeys'
    | 'affectedObjectIds'
    | 'fullRefresh'
  > | null
  chunkSize?: number
}

export type PreparedBakedFloorLightFieldBuild = {
  floorId: string
  floorCells: GridCell[]
  staticLightSources: ResolvedDungeonLightSource[]
  occlusion: BakedLightOcclusion | null
  dirtyHint?: BakedFloorLightFieldBuildInput['dirtyHint']
  chunkSize: number
  sourceHash: string
  cachedField: BakedFloorLightField | null
  dirtyChunkKeys: Set<string> | null
}

export type BakedFloorLightFieldWorkerLightSource = {
  key: string
  position: [number, number, number]
  linearColor: [number, number, number]
  light: {
    intensity: number
    distance: number
    decay: number
  }
}

export type BakedFloorLightFieldWorkerChunk = Pick<
  BakedLightChunk,
  'key' | 'chunkX' | 'chunkZ' | 'minCellX' | 'maxCellX' | 'minCellZ' | 'maxCellZ' | 'cellKeys'
>

export type BakedFloorLightFieldWorkerInput = {
  floorId: string
  sourceHash: string
  chunkSize: number
  chunks: BakedFloorLightFieldWorkerChunk[]
  staticLightSources: BakedFloorLightFieldWorkerLightSource[]
  flickerStaticLightSources: BakedFloorLightFieldWorkerLightSource[]
  solidWalls: string[]
  cornerBlockingWalls: string[]
}

export type BakedFloorLightFieldWorkerResult = {
  floorId: string
  sourceHash: string
  sampleUpdates: Array<{
    cellKey: string
    sample: BakedLightSample
  }>
  cornerUpdates: Array<{
    key: string
    cellX: number
    cellZ: number
    sample: BakedLightCornerSample
    flickerBand0: BakedLightSample | null
    flickerBand1: BakedLightSample | null
    flickerBand2: BakedLightSample | null
  }>
}

export function clearBakedFloorLightFieldCache() {
  floorLightFieldCache.forEach((field) => disposeBakedFloorLightField(field))
  floorLightFieldCache.clear()
  bakedLightOcclusionCache.clear()
  bakedLightSourceHashCache.clear()
}

export function createEmptyBakedFloorLightField(
  floorId: string,
  chunkSize = DEFAULT_BAKED_LIGHT_CHUNK_SIZE,
): BakedFloorLightField {
  return {
    floorId,
    chunkSize,
    bounds: null,
    staticLightSources: [],
    staticLightSourcesByChunkKey: {},
    occlusion: null,
    chunks: [],
    dirtyChunkKeys: [],
    dirtyChunkKeySet: new Set<string>(),
    lightFieldTexture: null,
    flickerLightFieldTextures: [null, null, null],
    gpuChunks: null,
    lightFieldTextureSize: { width: 0, height: 0 },
    lightFieldGridSize: { widthCells: 0, heightCells: 0 },
    cornerSampleByKey: {},
    sampleByCellKey: {},
    previousSourceHash: null,
    sourceHash: `empty:${floorId}:${chunkSize}`,
  }
}

export function pruneBakedFloorLightFieldCache(retainedFloorIds: Iterable<string>) {
  const retainedFloorIdSet = new Set(retainedFloorIds)
  for (const [floorId, field] of floorLightFieldCache.entries()) {
    if (retainedFloorIdSet.has(floorId)) {
      continue
    }

    disposeBakedFloorLightField(field)
    floorLightFieldCache.delete(floorId)
  }
}

export function getPropLightWorldPosition(
  object: Pick<DungeonObjectRecord, 'position' | 'rotation'>,
  offset?: [number, number, number],
): [number, number, number] {
  positionScratch.set(...object.position)
  if (!offset) {
    return positionScratch.toArray() as [number, number, number]
  }

  offsetScratch.set(...offset)
  rotationScratch.set(...object.rotation)
  offsetScratch.applyEuler(rotationScratch)
  positionScratch.add(offsetScratch)
  return positionScratch.toArray() as [number, number, number]
}

function disposeBakedFloorLightField(field: BakedFloorLightField) {
  field.lightFieldTexture?.dispose()
  field.flickerLightFieldTextures.forEach((texture) => texture?.dispose())
  field.gpuChunks?.lookupTexture?.dispose()
}

function disposeSupersededBakedFloorLightFieldResources(
  previousFields: Array<BakedFloorLightField | null | undefined>,
  nextField: BakedFloorLightField,
) {
  const disposedTextures = new Set<THREE.Texture>()
  const disposeIfReplaced = (
    texture: THREE.Texture | null | undefined,
    nextTexture: THREE.Texture | null | undefined,
  ) => {
    if (!texture || texture === nextTexture || disposedTextures.has(texture)) {
      return
    }

    disposedTextures.add(texture)
    texture.dispose()
  }

  previousFields.forEach((field) => {
    if (!field) {
      return
    }

    disposeIfReplaced(field.lightFieldTexture, nextField.lightFieldTexture)
    field.flickerLightFieldTextures.forEach((texture, index) => {
      disposeIfReplaced(texture, nextField.flickerLightFieldTextures[index])
    })
    disposeIfReplaced(field.gpuChunks?.lookupTexture, nextField.gpuChunks?.lookupTexture)
  })
}

export function resolveObjectLightSources(
  objects: DungeonObjectRecord[],
  previewOverrides: Record<string, ObjectLightOverrides> = {},
): ResolvedDungeonLightSource[] {
  return objects.flatMap((object) => {
    const asset = object.assetId ? getContentPackAssetById(object.assetId) : null
    const baseLight = asset?.getLight?.(object.props) ?? asset?.metadata?.light ?? null
    if (!baseLight) {
      return []
    }

    const light = mergePropLightWithOverrides(
      baseLight,
      previewOverrides[object.id] ?? getObjectLightOverrides(object.props),
    )
    if (!light) {
      return []
    }

    return [resolveLightSource(object.id, object, light)]
  })
}

export function resolveRegisteredLightSources(
  lightSources: RegisteredLightSource[],
  previewOverrides: Record<string, ObjectLightOverrides> = {},
): ResolvedDungeonLightSource[] {
  return lightSources.flatMap((source) => {
    const light = mergePropLightWithOverrides(
      source.light,
      previewOverrides[source.key] ?? getObjectLightOverrides(source.object.props),
    )
    if (!light) {
      return []
    }

    return [resolveLightSource(source.key, source.object, light)]
  })
}

export function classifyDynamicLightSources({
  lightSources,
  selectedKeys = new Set<string>(),
  previewKeys = new Set<string>(),
  cameraPosition,
  cameraFrustum,
  maxDynamicLights = DEFAULT_DYNAMIC_LIGHT_POOL_SIZE,
}: {
  lightSources: ResolvedDungeonLightSource[]
  selectedKeys?: ReadonlySet<string>
  previewKeys?: ReadonlySet<string>
  cameraPosition: readonly [number, number, number]
  cameraFrustum?: THREE.Frustum
  maxDynamicLights?: number
}) {
  const dynamicLightSources = lightSources
    .flatMap((lightSource) => {
      const viewPriority = getLightViewPriority(cameraFrustum, lightSource.position, lightSource.light)
      if (viewPriority === null) {
        return []
      }

      const dx = lightSource.position[0] - cameraPosition[0]
      const dy = lightSource.position[1] - cameraPosition[1]
      const dz = lightSource.position[2] - cameraPosition[2]

      return [{
        lightSource,
        priorityRank: getLightPriorityRank(lightSource.key, selectedKeys, previewKeys),
        viewPriority,
        distanceToCameraSquared: dx * dx + dy * dy + dz * dz,
      }]
    })
    .sort((left, right) =>
      left.priorityRank - right.priorityRank
      || left.viewPriority - right.viewPriority
      || left.distanceToCameraSquared - right.distanceToCameraSquared
      || right.lightSource.light.intensity - left.lightSource.light.intensity
      || left.lightSource.key.localeCompare(right.lightSource.key),
    )
    .slice(0, maxDynamicLights)
    .map(({ lightSource }) => lightSource)

  return {
    staticLightSources: lightSources,
    dynamicLightSources,
  }
}

export function getOrBuildBakedFloorLightField(input: BakedFloorLightFieldBuildInput) {
  const prepared = prepareBakedFloorLightFieldBuild(input)
  const {
    floorId,
    floorCells,
    staticLightSources,
    occlusion,
    chunkSize,
    sourceHash,
    cachedField: cached,
    dirtyChunkKeys,
  } = prepared
  if (cached?.sourceHash === sourceHash) {
    return cached
  }

  const next = buildBakedFloorLightField({
    floorId,
    floorCells,
    staticLightSources,
    occlusion,
    cachedField: cached,
    chunkSize,
    dirtyChunkKeys,
    previousSourceHash: cached?.sourceHash ?? null,
    sourceHash,
  })
  disposeSupersededBakedFloorLightFieldResources([cached], next)
  floorLightFieldCache.set(floorId, next)
  return next
}

export function prepareBakedFloorLightFieldBuild({
  floorId,
  floorCells,
  staticLightSources,
  occlusionInput,
  dirtyHint,
  chunkSize = DEFAULT_BAKED_LIGHT_CHUNK_SIZE,
}: BakedFloorLightFieldBuildInput): PreparedBakedFloorLightFieldBuild {
  const occlusion = buildBakedLightOcclusion(occlusionInput)
  const cachedField = floorLightFieldCache.get(floorId) ?? null
  const hintedDirtyChunkKeys = buildDirtyChunkKeysFromHint({
    dirtyHint,
    cachedField,
    staticLightSources,
    chunkSize,
  })
  const dirtyChunkKeys = hintedDirtyChunkKeys ?? (
    cachedField
      ? mergeDirtyChunkKeys(
        getDirtyChunkKeys({
          previousFloorCells: Object.keys(cachedField.sampleByCellKey),
          nextFloorCells: floorCells.map((cell) => getCellKey(cell)),
          previousLightSources: cachedField.staticLightSources,
          nextLightSources: staticLightSources,
          chunkSize,
        }),
        getDirtyChunkKeysForOcclusionChanges(cachedField.occlusion, occlusion, chunkSize),
      )
      : null
  )
  const sourceHash =
    cachedField && dirtyChunkKeys?.size === 0
      ? cachedField.sourceHash
      : buildLightFieldSourceHash({
          floorCells,
          staticLightSources,
          occlusion,
          chunkSize,
        })

  return {
    floorId,
    floorCells,
    staticLightSources,
    occlusion,
    dirtyHint,
    chunkSize,
    sourceHash,
    cachedField,
    dirtyChunkKeys,
  }
}

export function getBakedLightSampleForCell(
  field: BakedFloorLightField | null | undefined,
  cell: GridCell | string,
): BakedLightSample {
  const cellKey = typeof cell === 'string' ? cell : getCellKey(cell)
  return field?.sampleByCellKey[cellKey] ?? ZERO_BAKED_LIGHT_SAMPLE
}

export function getLightDistanceFalloff(light: Pick<PropLight, 'distance' | 'decay'>, distance: number) {
  const maxDistance = Math.max(light.distance, 0)
  if (maxDistance <= 0 || distance >= maxDistance) {
    return 0
  }

  const normalizedDistance = 1 - distance / maxDistance
  return Math.pow(normalizedDistance, Math.max(1, light.decay ?? 2))
}

export function getBakedLightDistanceFalloff(
  light: Pick<PropLight, 'distance' | 'decay'>,
  distance: number,
) {
  const maxDistance = Math.max(light.distance, 0)
  const extendedDistance = maxDistance * BAKED_LIGHT_DISTANCE_SCALE
  if (extendedDistance <= 0 || distance >= extendedDistance) {
    return 0
  }

  const normalizedDistance = 1 - distance / extendedDistance
  const softenedDecay = Math.max(1, (light.decay ?? 2) * 0.82)
  const baseFalloff = Math.pow(normalizedDistance, softenedDecay)
  const nearFieldDistance = Math.max(maxDistance * BAKED_LIGHT_NEAR_FIELD_FRACTION, Number.EPSILON)
  const nearFieldFactor = clamp01(1 - distance / nearFieldDistance)
  return baseFalloff * (1 + nearFieldFactor * BAKED_LIGHT_NEAR_FIELD_BOOST)
}

export function sampleStaticLightAtWorldPosition(
  staticLightSources: ResolvedDungeonLightSource[],
  worldPosition: readonly [number, number, number],
  occlusion: BakedLightOcclusion | null = null,
): BakedLightSample {
  let red = 0
  let green = 0
  let blue = 0

  staticLightSources.forEach((lightSource) => {
    const dx = lightSource.position[0] - worldPosition[0]
    const dy = lightSource.position[1] - worldPosition[1]
    const dz = lightSource.position[2] - worldPosition[2]
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const falloff = getBakedLightDistanceFalloff(lightSource.light, distance)
    if (falloff <= 0) {
      return
    }
    if (occlusion && !hasBakedLightLineOfSight(lightSource.position, worldPosition, occlusion)) {
      return
    }

    const intensity = lightSource.light.intensity * falloff
    red += lightSource.linearColor[0] * intensity
    green += lightSource.linearColor[1] * intensity
    blue += lightSource.linearColor[2] * intensity
  })

  return clampBakedLightSample([red, green, blue])
}

export function sampleBakedLightFieldAtWorldPosition(
  lightField: BakedFloorLightField | null | undefined,
  worldPosition: readonly [number, number, number],
): BakedLightSample {
  if (!lightField?.bounds) {
    return ZERO_BAKED_LIGHT_SAMPLE
  }

  const sampleX = worldPosition[0] / GRID_SIZE
  const sampleZ = worldPosition[2] / GRID_SIZE
  const localX = THREE.MathUtils.clamp(sampleX - lightField.bounds.minCellX, 0, lightField.lightFieldGridSize.widthCells)
  const localZ = THREE.MathUtils.clamp(sampleZ - lightField.bounds.minCellZ, 0, lightField.lightFieldGridSize.heightCells)
  const minCornerX = Math.floor(localX)
  const minCornerZ = Math.floor(localZ)
  const maxCornerX = Math.min(minCornerX + 1, lightField.lightFieldGridSize.widthCells)
  const maxCornerZ = Math.min(minCornerZ + 1, lightField.lightFieldGridSize.heightCells)
  const blendX = localX - minCornerX
  const blendZ = localZ - minCornerZ

  const corner00 = getCornerSample(lightField, lightField.bounds.minCellX + minCornerX, lightField.bounds.minCellZ + minCornerZ)
  const corner10 = getCornerSample(lightField, lightField.bounds.minCellX + maxCornerX, lightField.bounds.minCellZ + minCornerZ)
  const corner01 = getCornerSample(lightField, lightField.bounds.minCellX + minCornerX, lightField.bounds.minCellZ + maxCornerZ)
  const corner11 = getCornerSample(lightField, lightField.bounds.minCellX + maxCornerX, lightField.bounds.minCellZ + maxCornerZ)

  return [
    bilerp(corner00[0], corner10[0], corner01[0], corner11[0], blendX, blendZ),
    bilerp(corner00[1], corner10[1], corner01[1], corner11[1], blendX, blendZ),
    bilerp(corner00[2], corner10[2], corner01[2], corner11[2], blendX, blendZ),
  ]
}

export function getStaticLightSourcesForBounds(
  lightField: BakedFloorLightField | null | undefined,
  bounds: THREE.Box3 | null | undefined,
) {
  if (!lightField || !bounds || bounds.isEmpty()) {
    return []
  }

  const relevantLightSources = new Map<string, ResolvedDungeonLightSource>()
  getChunkKeysForWorldBounds(bounds, lightField.chunkSize).forEach((chunkKey) => {
    lightField.staticLightSourcesByChunkKey[chunkKey]?.forEach((lightSource) => {
      relevantLightSources.set(lightSource.key, lightSource)
    })
  })

  return [...relevantLightSources.values()]
}

export function doesBoundsIntersectDirtyChunks(
  lightField: BakedFloorLightField | null | undefined,
  bounds: THREE.Box3 | null | undefined,
) {
  if (!lightField || !bounds || bounds.isEmpty()) {
    return false
  }

  return getChunkKeysForWorldBounds(bounds, lightField.chunkSize)
    .some((chunkKey) => lightField.dirtyChunkKeySet.has(chunkKey))
}

export function buildPropBakedLightProbe(
  lightField: BakedFloorLightField | null | undefined,
  bounds: THREE.Box3 | null | undefined,
): PropBakedLightProbe | null {
  if (!lightField || !bounds || bounds.isEmpty()) {
    return null
  }

  const minY = bounds.min.y
  const maxY = bounds.max.y
  const spanY = Math.max(maxY - minY, 0.001)
  const spanX = Math.max(bounds.max.x - bounds.min.x, 0.001)
  const spanZ = Math.max(bounds.max.z - bounds.min.z, 0.001)
  const probeX = (bounds.min.x + bounds.max.x) * 0.5
  const probeZ = (bounds.min.z + bounds.max.z) * 0.5
  const baseY = minY + spanY * 0.2
  const topY = minY + spanY * 0.85
  const lateralProbeOffsetX = Math.max(spanX * 0.45, GRID_SIZE * 0.12)
  const lateralProbeOffsetZ = Math.max(spanZ * 0.45, GRID_SIZE * 0.12)
  const centerLight = samplePropProbeBaseLightAtWorldPosition(lightField, [probeX, baseY, probeZ])
  const eastLight = sampleBakedLightFieldAtWorldPosition(lightField, [probeX + lateralProbeOffsetX, baseY, probeZ])
  const westLight = sampleBakedLightFieldAtWorldPosition(lightField, [probeX - lateralProbeOffsetX, baseY, probeZ])
  const southLight = sampleBakedLightFieldAtWorldPosition(lightField, [probeX, baseY, probeZ + lateralProbeOffsetZ])
  const northLight = sampleBakedLightFieldAtWorldPosition(lightField, [probeX, baseY, probeZ - lateralProbeOffsetZ])
  const averageLuminance = (
    getBakedLightLuminance(centerLight)
    + getBakedLightLuminance(eastLight)
    + getBakedLightLuminance(westLight)
    + getBakedLightLuminance(southLight)
    + getBakedLightLuminance(northLight)
  ) / 5
  if (averageLuminance <= 1e-4) {
    return null
  }

  const baseLight = scaleBakedLightSample(centerLight, PROP_BAKED_LIGHT_MULTIPLIER)
  const topLight = scaleBakedLightSample(centerLight, PROP_BAKED_TOP_LIGHT_MULTIPLIER)
  const staticLightDirection = buildPropDirectionalLightFromStaticSources(lightField, bounds, [probeX, (baseY + topY) * 0.5, probeZ])
  const fallbackDirectionalVector = new THREE.Vector3(
    getBakedLightLuminance(eastLight) - getBakedLightLuminance(westLight),
    averageLuminance * 0.18,
    getBakedLightLuminance(southLight) - getBakedLightLuminance(northLight),
  )
  const directionalStrength = staticLightDirection
    ? staticLightDirection.directionalStrength
    : Math.min(
      fallbackDirectionalVector.length() / Math.max(averageLuminance * 1.35, 0.08),
      1,
    )
  const lightDirection = staticLightDirection
    ? staticLightDirection.lightDirection
    : fallbackDirectionalVector.lengthSq() > 1e-6
      ? fallbackDirectionalVector.normalize().toArray() as [number, number, number]
      : [0, 1, 0] as const

  return {
    baseLight,
    topLight,
    baseY,
    topY,
    lightDirection,
    directionalStrength,
  }
}

function buildPropDirectionalLightFromStaticSources(
  lightField: BakedFloorLightField,
  bounds: THREE.Box3,
  worldPosition: readonly [number, number, number],
) {
  const relevantLightSources = getStaticLightSourcesForBounds(lightField, bounds)
  if (relevantLightSources.length === 0) {
    return null
  }

  let totalWeight = 0
  directionalLightVectorScratch.set(0, 0, 0)
  relevantLightSources.forEach((lightSource) => {
    const dx = lightSource.position[0] - worldPosition[0]
    const dy = lightSource.position[1] - worldPosition[1]
    const dz = lightSource.position[2] - worldPosition[2]
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const falloff = getBakedLightDistanceFalloff(lightSource.light, distance)
    if (falloff <= 0) {
      return
    }
    if (lightField.occlusion && !hasBakedLightLineOfSight(lightSource.position, worldPosition, lightField.occlusion)) {
      return
    }

    const lightLuminance = getLinearColorLuminance(lightSource.linearColor)
    const weight = lightSource.light.intensity * falloff * Math.max(lightLuminance, 0.001)
    if (weight <= 1e-5) {
      return
    }

    directionalLightContributionScratch.set(dx, dy, dz)
    if (directionalLightContributionScratch.lengthSq() <= 1e-8) {
      return
    }

    directionalLightVectorScratch.add(
      directionalLightContributionScratch.normalize().multiplyScalar(weight),
    )
    totalWeight += weight
  })

  if (totalWeight <= 1e-5 || directionalLightVectorScratch.lengthSq() <= 1e-8) {
    return null
  }

  return {
    lightDirection: directionalLightVectorScratch.clone().normalize().toArray() as [number, number, number],
    directionalStrength: clamp01(directionalLightVectorScratch.length() / totalWeight),
  }
}

function samplePropProbeBaseLightAtWorldPosition(
  lightField: BakedFloorLightField,
  worldPosition: readonly [number, number, number],
): BakedLightSample {
  const cell = [
    Math.floor(worldPosition[0] / GRID_SIZE),
    Math.floor(worldPosition[2] / GRID_SIZE),
  ] as GridCell
  const discreteSample = getBakedLightSampleForCell(lightField, cell)
  const smoothedSample = sampleBakedLightFieldAtWorldPosition(lightField, worldPosition)
  return getBakedLightLuminance(discreteSample) >= getBakedLightLuminance(smoothedSample)
    ? discreteSample
    : smoothedSample
}

function getBakedLightLuminance(sample: BakedLightSample) {
  return sample[0] * 0.2126 + sample[1] * 0.7152 + sample[2] * 0.0722
}

function getLinearColorLuminance(color: readonly [number, number, number]) {
  return color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722
}

function getCornerSample(
  lightField: BakedFloorLightField,
  cellX: number,
  cellZ: number,
): BakedLightCornerSample {
  return lightField.cornerSampleByKey[`${cellX}:${cellZ}`] ?? ZERO_BAKED_LIGHT_SAMPLE
}

function bilerp(
  corner00: number,
  corner10: number,
  corner01: number,
  corner11: number,
  blendX: number,
  blendZ: number,
) {
  const top = THREE.MathUtils.lerp(corner00, corner10, blendX)
  const bottom = THREE.MathUtils.lerp(corner01, corner11, blendX)
  return THREE.MathUtils.lerp(top, bottom, blendZ)
}

function scaleBakedLightSample(sample: BakedLightSample, scale: number): BakedLightSample {
  return clampBakedLightSample([
    sample[0] * scale,
    sample[1] * scale,
    sample[2] * scale,
  ])
}

function resolveLightSource(key: string, object: DungeonObjectRecord, light: PropLight): ResolvedDungeonLightSource {
  colorScratch.set(light.color)
  return {
    key,
    object,
    light,
    position: getPropLightWorldPosition(object, light.offset),
    linearColor: [colorScratch.r, colorScratch.g, colorScratch.b],
  }
}

function getLightPriorityRank(
  key: string,
  selectedKeys: ReadonlySet<string>,
  previewKeys: ReadonlySet<string>,
) {
  if (selectedKeys.has(key)) {
    return 0
  }
  if (previewKeys.has(key)) {
    return 1
  }
  return 2
}

function getLightViewPriority(
  cameraFrustum: THREE.Frustum | undefined,
  position: [number, number, number],
  light: PropLight,
) {
  if (!cameraFrustum) {
    return 0
  }

  const lightDistance = Math.max(light.distance, 0)
  sphereScratch.center.set(...position)
  sphereScratch.radius = lightDistance
  if (cameraFrustum.intersectsSphere(sphereScratch)) {
    return 0
  }

  sphereScratch.radius = lightDistance + GRID_SIZE * 0.75
  if (cameraFrustum.intersectsSphere(sphereScratch)) {
    return 1
  }

  return null
}

function buildBakedFloorLightField({
  floorId,
  floorCells,
  staticLightSources,
  occlusion,
  cachedField,
  chunkSize,
  dirtyChunkKeys,
  previousSourceHash,
  sourceHash,
}: {
  floorId: string
  floorCells: GridCell[]
  staticLightSources: ResolvedDungeonLightSource[]
  occlusion: BakedLightOcclusion | null
  cachedField: BakedFloorLightField | null
  chunkSize: number
  dirtyChunkKeys: Set<string> | null
  previousSourceHash: string | null
  sourceHash: string
}) {
  const layout = buildBakedFloorLightFieldLayout({
    floorCells,
    staticLightSources,
    chunkSize,
    cachedField,
    dirtyChunkKeys,
  })
  const {
    bounds,
    chunks,
    effectiveDirtyChunkKeys,
    uniqueCellKeys,
    staticLightSourcesByChunkKey,
    flickerStaticLightSources,
  } = layout
  const sampleByCellKey: Record<string, BakedLightSample> = canReuseCachedBakedLightSamples(cachedField, chunkSize)
    ? { ...cachedField!.sampleByCellKey }
    : {}
  Object.keys(sampleByCellKey).forEach((cellKey) => {
    if (!uniqueCellKeys.has(cellKey)) {
      delete sampleByCellKey[cellKey]
    }
  })
  const cornerSampleByKey: Record<string, BakedLightCornerSample> = canReuseCachedBakedLightSamples(cachedField, chunkSize)
    ? cloneCornerSampleByKeyForBounds(cachedField!, bounds)
    : {}
  const {
    lightFieldTexture,
    flickerLightFieldTextures,
    gpuChunks,
    lightFieldTextureSize,
    lightFieldGridSize,
    textureLayoutChanged,
  } = prepareLightFieldTextures({
    bounds,
    chunks,
    chunkSize,
    cachedField,
    useFlickerTextures: flickerStaticLightSources.length > 0,
  })

  chunks.forEach((chunk) => {
    if (!effectiveDirtyChunkKeys.has(chunk.key)) {
      return
    }

    chunk.cellKeys.forEach((cellKey) => {
      const [cellX, cellZ] = cellKey.split(':').map((value) => Number.parseInt(value, 10))
      sampleByCellKey[cellKey] = sampleStaticLightAtWorldPosition(staticLightSources, cellToWorldPosition([cellX, cellZ]), occlusion)
    })
  })

  updateLightFieldTextureChunks({
    bounds,
    chunks: chunks.filter((chunk) => effectiveDirtyChunkKeys.has(chunk.key)),
    chunkSize,
    staticLightSources,
    flickerStaticLightSources,
    occlusion,
    cornerSampleByKey,
    lightFieldTexture,
    flickerLightFieldTextures,
    gpuChunks,
    textureLayoutChanged,
  })

  return {
    floorId,
    chunkSize,
    bounds,
    staticLightSources,
    staticLightSourcesByChunkKey,
    occlusion,
    chunks: chunks
      .map((chunk) => ({
        ...chunk,
        dirty: effectiveDirtyChunkKeys.has(chunk.key),
      }))
      .sort((left, right) => left.chunkZ - right.chunkZ || left.chunkX - right.chunkX),
    dirtyChunkKeys: [...effectiveDirtyChunkKeys].sort(),
    dirtyChunkKeySet: effectiveDirtyChunkKeys,
    lightFieldTexture,
    flickerLightFieldTextures,
    gpuChunks,
    lightFieldTextureSize,
    lightFieldGridSize,
    cornerSampleByKey,
    sampleByCellKey,
    previousSourceHash,
    sourceHash,
  } satisfies BakedFloorLightField
}

function buildBakedFloorLightFieldLayout({
  floorCells,
  staticLightSources,
  chunkSize,
  cachedField,
  dirtyChunkKeys,
}: {
  floorCells: GridCell[]
  staticLightSources: ResolvedDungeonLightSource[]
  chunkSize: number
  cachedField: BakedFloorLightField | null
  dirtyChunkKeys: Set<string> | null
}): BakedFloorLightFieldLayout {
  const staticLightSourcesByChunkKey = buildStaticLightSourcesByChunkKey(staticLightSources, chunkSize)
  const chunkBuilders = new Map<string, Omit<BakedLightChunk, 'dirty'>>()
  const uniqueCellKeys = new Set<string>()
  const flickerStaticLightSources = staticLightSources.filter((lightSource) => lightSource.light.flicker)

  let minCellX = Number.POSITIVE_INFINITY
  let maxCellX = Number.NEGATIVE_INFINITY
  let minCellZ = Number.POSITIVE_INFINITY
  let maxCellZ = Number.NEGATIVE_INFINITY

  floorCells.forEach((cell) => {
    const cellKey = getCellKey(cell)
    if (uniqueCellKeys.has(cellKey)) {
      return
    }
    uniqueCellKeys.add(cellKey)

    minCellX = Math.min(minCellX, cell[0])
    maxCellX = Math.max(maxCellX, cell[0])
    minCellZ = Math.min(minCellZ, cell[1])
    maxCellZ = Math.max(maxCellZ, cell[1])

    const chunkX = Math.floor(cell[0] / chunkSize)
    const chunkZ = Math.floor(cell[1] / chunkSize)
    const chunkKey = `${chunkX}:${chunkZ}`
    const existing = chunkBuilders.get(chunkKey)
    if (existing) {
      existing.minCellX = Math.min(existing.minCellX, cell[0])
      existing.maxCellX = Math.max(existing.maxCellX, cell[0])
      existing.minCellZ = Math.min(existing.minCellZ, cell[1])
      existing.maxCellZ = Math.max(existing.maxCellZ, cell[1])
      existing.cellKeys.push(cellKey)
      return
    }

    chunkBuilders.set(chunkKey, {
      key: chunkKey,
      chunkX,
      chunkZ,
      minCellX: cell[0],
      maxCellX: cell[0],
      minCellZ: cell[1],
      maxCellZ: cell[1],
      cellKeys: [cellKey],
    })
  })

  const bounds = Number.isFinite(minCellX)
    ? {
      minCellX,
      maxCellX,
      minCellZ,
      maxCellZ,
    }
    : null
  const chunks = [...chunkBuilders.values()]
  const chunkKeys = new Set(chunkBuilders.keys())
  const needsFullChunkRebuild = !canReuseCachedBakedLightSamples(cachedField, chunkSize)
    || hasFlickerTextureTopologyChanged(cachedField, flickerStaticLightSources.length > 0)
  const baseDirtyChunkKeys = needsFullChunkRebuild
    ? chunkKeys
    : dirtyChunkKeys ?? chunkKeys
  const effectiveDirtyChunkKeys = needsFullChunkRebuild
    ? chunkKeys
    : expandChunkHaloKeys(baseDirtyChunkKeys, chunkKeys)

  return {
    bounds,
    chunks,
    effectiveDirtyChunkKeys,
    uniqueCellKeys,
    staticLightSourcesByChunkKey,
    flickerStaticLightSources,
  }
}

function expandChunkHaloKeys(chunkKeys: ReadonlySet<string>, availableChunkKeys: ReadonlySet<string>) {
  const expanded = new Set<string>()

  chunkKeys.forEach((chunkKey) => {
    const [chunkX, chunkZ] = chunkKey.split(':').map((value) => Number.parseInt(value, 10))
    for (let deltaZ = -BAKED_LIGHT_CHUNK_HALO; deltaZ <= BAKED_LIGHT_CHUNK_HALO; deltaZ += 1) {
      for (let deltaX = -BAKED_LIGHT_CHUNK_HALO; deltaX <= BAKED_LIGHT_CHUNK_HALO; deltaX += 1) {
        const candidateKey = `${chunkX + deltaX}:${chunkZ + deltaZ}`
        if (availableChunkKeys.has(candidateKey)) {
          expanded.add(candidateKey)
        }
      }
    }
  })

  return expanded
}

export function prepareBakedFloorLightFieldWorkerBuild(
  prepared: PreparedBakedFloorLightFieldBuild,
) {
  if (prepared.staticLightSources.length === 0) {
    return null
  }

  const layout = buildBakedFloorLightFieldLayout({
    floorCells: prepared.floorCells,
    staticLightSources: prepared.staticLightSources,
    chunkSize: prepared.chunkSize,
    cachedField: prepared.cachedField,
    dirtyChunkKeys: prepared.dirtyChunkKeys,
  })
  if (layout.chunks.length === 0) {
    return null
  }

  const workerLightSources = getWorkerLightSourcesForDirtyChunks(
    layout.staticLightSourcesByChunkKey,
    layout.effectiveDirtyChunkKeys,
  )

  return {
    layout,
    workerInput: {
      floorId: prepared.floorId,
      sourceHash: prepared.sourceHash,
      chunkSize: prepared.chunkSize,
      chunks: layout.chunks
        .filter((chunk) => layout.effectiveDirtyChunkKeys.has(chunk.key))
        .map((chunk) => ({ ...chunk })),
      staticLightSources: serializeWorkerLightSources(workerLightSources.staticLightSources),
      flickerStaticLightSources: serializeWorkerLightSources(workerLightSources.flickerStaticLightSources),
      solidWalls: prepared.occlusion
        ? filterWallsForDirtyChunks(
          prepared.occlusion.solidWalls,
          layout.effectiveDirtyChunkKeys,
          prepared.chunkSize,
        )
        : [],
      cornerBlockingWalls: prepared.occlusion
        ? filterWallsForDirtyChunks(
          prepared.occlusion.cornerBlockingWalls,
          layout.effectiveDirtyChunkKeys,
          prepared.chunkSize,
        )
        : [],
    } satisfies BakedFloorLightFieldWorkerInput,
  }
}

export function createPendingBakedFloorLightField({
  prepared,
  layout,
}: {
  prepared: PreparedBakedFloorLightFieldBuild
  layout: BakedFloorLightFieldLayout
}) {
  const cachedField = prepared.cachedField
  const {
    lightFieldTexture,
    flickerLightFieldTextures,
    gpuChunks,
    lightFieldTextureSize,
    lightFieldGridSize,
  } = prepareLightFieldTextures({
    bounds: layout.bounds,
    chunks: layout.chunks,
    chunkSize: prepared.chunkSize,
    cachedField,
    useFlickerTextures: layout.flickerStaticLightSources.length > 0,
  })
  const sampleByCellKey = clonePendingSampleByCellKey(cachedField, layout.uniqueCellKeys)
  const cornerSampleByKey = clonePendingCornerSampleByKey(cachedField, layout.bounds)

  return {
    floorId: prepared.floorId,
    chunkSize: prepared.chunkSize,
    bounds: layout.bounds,
    staticLightSources: prepared.staticLightSources,
    staticLightSourcesByChunkKey: layout.staticLightSourcesByChunkKey,
    occlusion: prepared.occlusion,
    chunks: layout.chunks
      .map((chunk) => ({
        ...chunk,
        dirty: layout.effectiveDirtyChunkKeys.has(chunk.key),
      }))
      .sort((left, right) => left.chunkZ - right.chunkZ || left.chunkX - right.chunkX),
    dirtyChunkKeys: [...layout.effectiveDirtyChunkKeys].sort(),
    dirtyChunkKeySet: layout.effectiveDirtyChunkKeys,
    lightFieldTexture,
    flickerLightFieldTextures,
    gpuChunks,
    lightFieldTextureSize,
    lightFieldGridSize,
    cornerSampleByKey,
    sampleByCellKey,
    previousSourceHash: cachedField?.sourceHash ?? null,
    sourceHash: prepared.sourceHash,
  } satisfies BakedFloorLightField
}

export function shouldShowPendingBakedFloorLightField({
  cachedField,
}: {
  cachedField: BakedFloorLightField | null
  bounds: BakedFloorLightField['bounds']
  useFlickerTextures: boolean
}) {
  // Only show a dark pending field when there is no previous result to display.
  // When a cached field exists — even if the layout has changed (e.g. the player
  // extended the dungeon bounds) — keep it visible until the worker delivers the
  // complete new result. Swapping in an empty pending field forces a pipeline-
  // signature change → configureTilePage → full TSL/WebGPU pipeline recompilation
  // for every tile page, causing a multi-frame GPU stutter. The one-shot swap on
  // worker completion is imperceptible compared to that stall.
  return !cachedField
}

export function applyBakedFloorLightFieldWorkerResult({
  prepared,
  layout,
  result,
  textureReuseField = null,
}: {
  prepared: PreparedBakedFloorLightFieldBuild
  layout: BakedFloorLightFieldLayout
  result: BakedFloorLightFieldWorkerResult
  textureReuseField?: BakedFloorLightField | null
}) {
  const previousField = prepared.cachedField
  const reusableTextureField = textureReuseField ?? previousField
  const canReuseCachedSamples = canReuseCachedBakedLightSamples(previousField, prepared.chunkSize)
  const sampleByCellKey: Record<string, BakedLightSample> = canReuseCachedSamples && previousField
    ? { ...previousField.sampleByCellKey }
    : {}
  Object.keys(sampleByCellKey).forEach((cellKey) => {
    if (!layout.uniqueCellKeys.has(cellKey)) {
      delete sampleByCellKey[cellKey]
    }
  })
  result.sampleUpdates.forEach(({ cellKey, sample }) => {
    sampleByCellKey[cellKey] = sample
  })
  const cornerSampleByKey: Record<string, BakedLightCornerSample> = canReuseCachedSamples && previousField
    ? cloneCornerSampleByKeyForBounds(previousField, layout.bounds)
    : {}
  result.cornerUpdates.forEach(({ key, sample }) => {
    cornerSampleByKey[key] = sample
  })

  const {
    lightFieldTexture,
    flickerLightFieldTextures,
    gpuChunks,
    lightFieldTextureSize,
    lightFieldGridSize,
    textureLayoutChanged,
  } = prepareLightFieldTextures({
    bounds: layout.bounds,
    chunks: layout.chunks,
    chunkSize: prepared.chunkSize,
    cachedField: reusableTextureField,
    useFlickerTextures: layout.flickerStaticLightSources.length > 0,
  })
  applyWorkerCornerUpdatesToTextures({
    bounds: layout.bounds,
    cornerUpdates: result.cornerUpdates,
    chunkSize: prepared.chunkSize,
    lightFieldTexture,
    flickerLightFieldTextures,
    gpuChunks,
    textureLayoutChanged,
  })

  const next = {
    floorId: prepared.floorId,
    chunkSize: prepared.chunkSize,
    bounds: layout.bounds,
    staticLightSources: prepared.staticLightSources,
    staticLightSourcesByChunkKey: layout.staticLightSourcesByChunkKey,
    occlusion: prepared.occlusion,
    chunks: layout.chunks
      .map((chunk) => ({
        ...chunk,
        dirty: layout.effectiveDirtyChunkKeys.has(chunk.key),
      }))
      .sort((left, right) => left.chunkZ - right.chunkZ || left.chunkX - right.chunkX),
    dirtyChunkKeys: [...layout.effectiveDirtyChunkKeys].sort(),
    dirtyChunkKeySet: layout.effectiveDirtyChunkKeys,
    lightFieldTexture,
    flickerLightFieldTextures,
    gpuChunks,
    lightFieldTextureSize,
    lightFieldGridSize,
    cornerSampleByKey,
    sampleByCellKey,
    previousSourceHash: previousField?.sourceHash ?? null,
    sourceHash: prepared.sourceHash,
  } satisfies BakedFloorLightField

  disposeSupersededBakedFloorLightFieldResources(
    reusableTextureField && reusableTextureField !== previousField
      ? [previousField, reusableTextureField]
      : [previousField],
    next,
  )
  floorLightFieldCache.set(prepared.floorId, next)
  return next
}

function serializeWorkerLightSources(
  lightSources: ResolvedDungeonLightSource[],
): BakedFloorLightFieldWorkerLightSource[] {
  return lightSources.map((lightSource) => ({
    key: lightSource.key,
    position: lightSource.position,
    linearColor: lightSource.linearColor,
    light: {
      intensity: lightSource.light.intensity,
      distance: lightSource.light.distance,
      decay: lightSource.light.decay ?? 2,
    },
  }))
}

function buildDirtyChunkKeysFromHint({
  dirtyHint,
  cachedField,
  staticLightSources,
  chunkSize,
}: {
  dirtyHint: BakedFloorLightFieldBuildInput['dirtyHint']
  cachedField: BakedFloorLightField | null
  staticLightSources: ResolvedDungeonLightSource[]
  chunkSize: number
}) {
  if (!dirtyHint || dirtyHint.fullRefresh) {
    return null
  }

  const dirtyChunkKeys = new Set<string>()

  dirtyHint.dirtyLightChunkKeys.forEach((chunkKey) => dirtyChunkKeys.add(chunkKey))
  dirtyHint.dirtyChunkKeys.forEach((chunkKey) => dirtyChunkKeys.add(chunkKey))
  if (dirtyHint.dirtyCellKeys.length > 0) {
    addDirtyCellChunkKeys(dirtyChunkKeys, dirtyHint.dirtyCellKeys, chunkSize)
  } else {
    addDirtyRectChunkKeys(dirtyChunkKeys, dirtyHint.dirtyCellRect, chunkSize)
  }
  dirtyHint.dirtyWallKeys.forEach((wallKey) => {
    for (const chunkKey of getChunkKeysForWallKey(wallKey, chunkSize)) {
      dirtyChunkKeys.add(chunkKey)
    }
  })
  addAffectedLightChunkKeys(dirtyChunkKeys, dirtyHint.affectedObjectIds, staticLightSources, chunkSize)
  addAffectedLightChunkKeys(dirtyChunkKeys, dirtyHint.affectedObjectIds, cachedField?.staticLightSources ?? [], chunkSize)

  return dirtyChunkKeys.size > 0 ? dirtyChunkKeys : null
}

function addDirtyCellChunkKeys(
  target: Set<string>,
  dirtyCellKeys: string[],
  chunkSize: number,
) {
  dirtyCellKeys.forEach((cellKey) => {
    const [cellXPart, cellZPart] = cellKey.split(':')
    const cellX = Number.parseInt(cellXPart ?? '', 10)
    const cellZ = Number.parseInt(cellZPart ?? '', 10)
    if (Number.isNaN(cellX) || Number.isNaN(cellZ)) {
      return
    }

    target.add(getChunkKeyForCell(cellX, cellZ, chunkSize))
  })
}

function addDirtyRectChunkKeys(
  target: Set<string>,
  dirtyCellRect: FloorDirtyRect,
  chunkSize: number,
) {
  if (!dirtyCellRect) {
    return
  }

  for (let cellZ = dirtyCellRect.minCellZ; cellZ <= dirtyCellRect.maxCellZ; cellZ += 1) {
    for (let cellX = dirtyCellRect.minCellX; cellX <= dirtyCellRect.maxCellX; cellX += 1) {
      target.add(getChunkKeyForCell(cellX, cellZ, chunkSize))
    }
  }
}

function addAffectedLightChunkKeys(
  target: Set<string>,
  affectedObjectIds: string[],
  lightSources: ResolvedDungeonLightSource[],
  chunkSize: number,
) {
  if (affectedObjectIds.length === 0 || lightSources.length === 0) {
    return
  }

  const affectedSet = new Set(affectedObjectIds)
  lightSources.forEach((lightSource) => {
    if (!affectedSet.has(lightSource.object.id)) {
      return
    }
    getLightInfluencedChunkKeys(lightSource, chunkSize).forEach((chunkKey) => target.add(chunkKey))
  })
}

function getWorkerLightSourcesForDirtyChunks(
  staticLightSourcesByChunkKey: Record<string, ResolvedDungeonLightSource[]>,
  effectiveDirtyChunkKeys: ReadonlySet<string>,
) {
  const staticLightSources = new Map<string, ResolvedDungeonLightSource>()
  const flickerStaticLightSources = new Map<string, ResolvedDungeonLightSource>()

  effectiveDirtyChunkKeys.forEach((chunkKey) => {
    staticLightSourcesByChunkKey[chunkKey]?.forEach((lightSource) => {
      staticLightSources.set(lightSource.key, lightSource)
      if (lightSource.light.flicker) {
        flickerStaticLightSources.set(lightSource.key, lightSource)
      }
    })
  })

  return {
    staticLightSources: [...staticLightSources.values()],
    flickerStaticLightSources: [...flickerStaticLightSources.values()],
  }
}

function filterWallsForDirtyChunks(
  walls: ReadonlySet<string>,
  effectiveDirtyChunkKeys: ReadonlySet<string>,
  chunkSize: number,
) {
  return [...walls].filter((wallKey) => {
    for (const chunkKey of getChunkKeysForWallKey(wallKey, chunkSize)) {
      if (effectiveDirtyChunkKeys.has(chunkKey)) {
        return true
      }
    }
    return false
  })
}

function getDirtyChunkKeys({
  previousFloorCells,
  nextFloorCells,
  previousLightSources,
  nextLightSources,
  chunkSize,
}: {
  previousFloorCells: string[]
  nextFloorCells: string[]
  previousLightSources: ResolvedDungeonLightSource[]
  nextLightSources: ResolvedDungeonLightSource[]
  chunkSize: number
}) {
  const dirtyChunkKeys = new Set<string>()
  const previousCellSet = new Set(previousFloorCells)
  const nextCellSet = new Set(nextFloorCells)

  previousFloorCells.forEach((cellKey) => {
    if (!nextCellSet.has(cellKey)) {
      dirtyChunkKeys.add(getChunkKeyForCellKey(cellKey, chunkSize))
    }
  })
  nextFloorCells.forEach((cellKey) => {
    if (!previousCellSet.has(cellKey)) {
      dirtyChunkKeys.add(getChunkKeyForCellKey(cellKey, chunkSize))
    }
  })

  const previousLightMap = new Map(previousLightSources.map((lightSource) => [lightSource.key, lightSource]))
  const nextLightMap = new Map(nextLightSources.map((lightSource) => [lightSource.key, lightSource]))

  previousLightMap.forEach((previousLightSource, key) => {
    const nextLightSource = nextLightMap.get(key)
    if (!nextLightSource || !areResolvedLightSourcesEqual(previousLightSource, nextLightSource)) {
      getLightInfluencedChunkKeys(previousLightSource, chunkSize).forEach((chunkKey) => dirtyChunkKeys.add(chunkKey))
    }
  })
  nextLightMap.forEach((nextLightSource, key) => {
    const previousLightSource = previousLightMap.get(key)
    if (!previousLightSource || !areResolvedLightSourcesEqual(previousLightSource, nextLightSource)) {
      getLightInfluencedChunkKeys(nextLightSource, chunkSize).forEach((chunkKey) => dirtyChunkKeys.add(chunkKey))
    }
  })

  return dirtyChunkKeys
}

function mergeDirtyChunkKeys(
  left: Set<string> | null,
  right: Set<string> | null,
) {
  if (left === null || right === null) {
    return null
  }

  return new Set<string>([...left, ...right])
}

function areResolvedLightSourcesEqual(
  left: ResolvedDungeonLightSource,
  right: ResolvedDungeonLightSource,
) {
  return left.key === right.key
    && left.light.color === right.light.color
    && left.light.intensity === right.light.intensity
    && left.light.distance === right.light.distance
    && (left.light.decay ?? 2) === (right.light.decay ?? 2)
    && Boolean(left.light.flicker) === Boolean(right.light.flicker)
    && left.position[0] === right.position[0]
    && left.position[1] === right.position[1]
    && left.position[2] === right.position[2]
}

function getLightInfluencedChunkKeys(lightSource: ResolvedDungeonLightSource, chunkSize: number) {
  const chunkKeys = new Set<string>()
  const radiusCells = Math.ceil(lightSource.light.distance / GRID_SIZE)
  const centerCellX = Math.floor(lightSource.position[0] / GRID_SIZE)
  const centerCellZ = Math.floor(lightSource.position[2] / GRID_SIZE)

  for (let cellZ = centerCellZ - radiusCells; cellZ <= centerCellZ + radiusCells; cellZ += 1) {
    for (let cellX = centerCellX - radiusCells; cellX <= centerCellX + radiusCells; cellX += 1) {
      chunkKeys.add(getChunkKeyForCell(cellX, cellZ, chunkSize))
    }
  }

  return chunkKeys
}

function buildStaticLightSourcesByChunkKey(
  staticLightSources: ResolvedDungeonLightSource[],
  chunkSize: number,
) {
  const staticLightSourcesByChunkKey: Record<string, ResolvedDungeonLightSource[]> = {}

  staticLightSources.forEach((lightSource) => {
    getLightInfluencedChunkKeys(lightSource, chunkSize).forEach((chunkKey) => {
      if (!staticLightSourcesByChunkKey[chunkKey]) {
        staticLightSourcesByChunkKey[chunkKey] = []
      }
      staticLightSourcesByChunkKey[chunkKey].push(lightSource)
    })
  })

  return staticLightSourcesByChunkKey
}

function getChunkKeyForCellKey(cellKey: string, chunkSize: number) {
  const [cellX, cellZ] = cellKey.split(':').map((value) => Number.parseInt(value, 10))
  return getChunkKeyForCell(cellX, cellZ, chunkSize)
}

function getChunkKeyForCell(cellX: number, cellZ: number, chunkSize: number) {
  return `${Math.floor(cellX / chunkSize)}:${Math.floor(cellZ / chunkSize)}`
}

function getChunkKeysForWorldBounds(bounds: THREE.Box3, chunkSize: number) {
  const chunkKeys = new Set<string>()
  const maxWorldX = Math.max(bounds.max.x - 1e-6, bounds.min.x)
  const maxWorldZ = Math.max(bounds.max.z - 1e-6, bounds.min.z)
  const minCellX = Math.floor(bounds.min.x / GRID_SIZE)
  const maxCellX = Math.floor(maxWorldX / GRID_SIZE)
  const minCellZ = Math.floor(bounds.min.z / GRID_SIZE)
  const maxCellZ = Math.floor(maxWorldZ / GRID_SIZE)

  for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ += 1) {
    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      chunkKeys.add(getChunkKeyForCell(cellX, cellZ, chunkSize))
    }
  }

  return [...chunkKeys]
}

function canReuseCachedBakedLightSamples(
  cachedField: BakedFloorLightField | null,
  chunkSize: number,
) {
  return Boolean(cachedField && cachedField.chunkSize === chunkSize)
}

function cloneCornerSampleByKeyForBounds(
  cachedField: BakedFloorLightField,
  bounds: BakedFloorLightField['bounds'],
) {
  if (!bounds) {
    return {}
  }

  const cornerSampleByKey: Record<string, BakedLightCornerSample> = {}
  Object.entries(cachedField.cornerSampleByKey).forEach(([key, sample]) => {
    const parsedCorner = parsePendingCellKey(key)
    if (!parsedCorner) {
      return
    }
    if (
      parsedCorner[0] < bounds.minCellX
      || parsedCorner[0] > bounds.maxCellX + 1
      || parsedCorner[1] < bounds.minCellZ
      || parsedCorner[1] > bounds.maxCellZ + 1
    ) {
      return
    }
    cornerSampleByKey[key] = sample
  })
  return cornerSampleByKey
}

function hasFlickerTextureTopologyChanged(
  cachedField: BakedFloorLightField | null,
  useFlickerTextures: boolean,
) {
  const cachedHasFlickerTextures = Boolean(cachedField?.flickerLightFieldTextures.some((texture) => texture))
  return cachedHasFlickerTextures !== useFlickerTextures
}

function getDirtyChunkKeysForOcclusionChanges(
  previousOcclusion: BakedLightOcclusion | null,
  nextOcclusion: BakedLightOcclusion | null,
  chunkSize: number,
) {
  if (previousOcclusion === nextOcclusion) {
    return new Set<string>()
  }
  if (!previousOcclusion || !nextOcclusion) {
    return previousOcclusion !== nextOcclusion ? null : new Set<string>()
  }

  const changedWallKeys = new Set<string>()
  collectChangedSetValues(previousOcclusion.openWalls, nextOcclusion.openWalls, changedWallKeys)
  collectChangedSetValues(previousOcclusion.solidWalls, nextOcclusion.solidWalls, changedWallKeys)
  collectChangedSetValues(previousOcclusion.cornerBlockingWalls, nextOcclusion.cornerBlockingWalls, changedWallKeys)

  const dirtyChunkKeys = new Set<string>()
  changedWallKeys.forEach((wallKey) => {
    for (const candidateKey of getChunkKeysForWallKey(wallKey, chunkSize)) {
      dirtyChunkKeys.add(candidateKey)
    }
  })

  return dirtyChunkKeys
}

function collectChangedSetValues(
  previous: ReadonlySet<string>,
  next: ReadonlySet<string>,
  target: Set<string>,
) {
  for (const value of previous) {
    if (!next.has(value)) {
      target.add(value)
    }
  }

  for (const value of next) {
    if (!previous.has(value)) {
      target.add(value)
    }
  }
}

function getChunkKeysForWallKey(wallKey: string, chunkSize: number) {
  const chunkKeys = new Set<string>()

  const addCell = (cellX: number, cellZ: number) => {
    chunkKeys.add(getChunkKeyForCell(cellX, cellZ, chunkSize))
  }

  const parsed = parseWallCell(wallKey)
  if (parsed) {
    addCell(parsed.cellX, parsed.cellZ)
  }

  const mirroredWallKey = getMirroredWallKey(wallKey)
  if (mirroredWallKey) {
    const mirroredParsed = parseWallCell(mirroredWallKey)
    if (mirroredParsed) {
      addCell(mirroredParsed.cellX, mirroredParsed.cellZ)
    }
  }

  return chunkKeys
}

function parseWallCell(wallKey: string) {
  const [cellXPart, cellZPart] = wallKey.split(':')
  const cellX = Number.parseInt(cellXPart ?? '', 10)
  const cellZ = Number.parseInt(cellZPart ?? '', 10)

  if (Number.isNaN(cellX) || Number.isNaN(cellZ)) {
    return null
  }

  return { cellX, cellZ }
}

function parsePendingCellKey(cellKey: string): GridCell | null {
  const [cellXPart, cellZPart] = cellKey.split(':')
  const cellX = Number.parseInt(cellXPart ?? '', 10)
  const cellZ = Number.parseInt(cellZPart ?? '', 10)
  if (Number.isNaN(cellX) || Number.isNaN(cellZ)) {
    return null
  }
  return [cellX, cellZ]
}

function createLightFieldTexture(data: Float32Array, width: number, height: number) {
  const texture = new THREE.DataTexture(
    data,
    width,
    height,
    THREE.RGBAFormat,
    THREE.FloatType,
  )
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

function createLightFieldArrayTexture(data: Float32Array, width: number, height: number, depth: number) {
  const texture = new THREE.DataArrayTexture(
    data,
    width,
    height,
    depth,
  )
  texture.format = THREE.RGBAFormat
  texture.type = THREE.FloatType
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

function isChunkedLightFieldTexture(
  texture: BakedLightFieldTexture | null | undefined,
): texture is THREE.DataArrayTexture {
  return texture instanceof THREE.DataArrayTexture
}

function getChunkLayerTextureIndex({
  chunkX,
  chunkZ,
  chunkSize,
  cellX,
  cellZ,
  textureWidth,
  textureHeight,
  layerIndex,
}: {
  chunkX: number
  chunkZ: number
  chunkSize: number
  cellX: number
  cellZ: number
  textureWidth: number
  textureHeight: number
  layerIndex: number
}) {
  const localX = THREE.MathUtils.clamp(cellX - chunkX * chunkSize, 0, textureWidth - 1)
  const localZ = THREE.MathUtils.clamp(cellZ - chunkZ * chunkSize, 0, textureHeight - 1)
  const layerStride = textureWidth * textureHeight * 4
  return layerIndex * layerStride + (localZ * textureWidth + localX) * 4
}

function getChunkLayerTargetsForCorner({
  cellX,
  cellZ,
  chunkSize,
  gpuChunks,
}: {
  cellX: number
  cellZ: number
  chunkSize: number
  gpuChunks: NonNullable<BakedFloorLightField['gpuChunks']>
}) {
  const primaryChunkX = Math.floor(cellX / chunkSize)
  const primaryChunkZ = Math.floor(cellZ / chunkSize)
  const candidateChunkXs = new Set<number>([primaryChunkX])
  const candidateChunkZs = new Set<number>([primaryChunkZ])

  if (cellX % chunkSize === 0) {
    candidateChunkXs.add(primaryChunkX - 1)
  }
  if (cellZ % chunkSize === 0) {
    candidateChunkZs.add(primaryChunkZ - 1)
  }

  const targets: Array<{ chunkX: number, chunkZ: number, layerIndex: number }> = []
  candidateChunkXs.forEach((chunkX) => {
    candidateChunkZs.forEach((chunkZ) => {
      const layerIndex = gpuChunks.layerByChunkKey[`${chunkX}:${chunkZ}`]
      if (layerIndex === undefined) {
        return
      }
      targets.push({ chunkX, chunkZ, layerIndex })
    })
  })

  return targets
}

function markChunkTextureUpdate(
  texture: BakedLightFieldTexture,
  dirtyLayerIndices: ReadonlySet<number>,
  textureLayoutChanged: boolean,
) {
  if (!textureLayoutChanged && dirtyLayerIndices.size === 0) {
    return
  }

  if (isChunkedLightFieldTexture(texture)) {
    texture.clearLayerUpdates()
    if (!textureLayoutChanged) {
      dirtyLayerIndices.forEach((layerIndex) => texture.addLayerUpdate(layerIndex))
    }
  }

  texture.needsUpdate = true
}

function clonePendingSampleByCellKey(
  cachedField: BakedFloorLightField | null,
  uniqueCellKeys: ReadonlySet<string>,
) {
  if (!cachedField) {
    return {}
  }

  const sampleByCellKey: Record<string, BakedLightSample> = {}
  uniqueCellKeys.forEach((cellKey) => {
    const sample = cachedField.sampleByCellKey[cellKey]
    if (sample) {
      sampleByCellKey[cellKey] = sample
    }
  })
  return sampleByCellKey
}

function clonePendingCornerSampleByKey(
  cachedField: BakedFloorLightField | null,
  bounds: BakedFloorLightField['bounds'],
) {
  if (!cachedField || !bounds) {
    return {}
  }

  const cornerSampleByKey: Record<string, BakedLightCornerSample> = {}
  Object.entries(cachedField.cornerSampleByKey).forEach(([key, sample]) => {
    const parsedCorner = parsePendingCellKey(key)
    if (!parsedCorner) {
      return
    }
    if (
      parsedCorner[0] < bounds.minCellX
      || parsedCorner[0] > bounds.maxCellX + 1
      || parsedCorner[1] < bounds.minCellZ
      || parsedCorner[1] > bounds.maxCellZ + 1
    ) {
      return
    }
    cornerSampleByKey[key] = sample
  })
  return cornerSampleByKey
}

function prepareLightFieldTextures({
  bounds,
  chunks,
  chunkSize,
  cachedField,
  useFlickerTextures,
}: {
  bounds: BakedFloorLightField['bounds']
  chunks: Array<Omit<BakedLightChunk, 'dirty'>>
  chunkSize: number
  cachedField: BakedFloorLightField | null
  useFlickerTextures: boolean
}): PreparedBakedLightFieldTextures {
  if (!bounds) {
    return {
      lightFieldTexture: null,
      flickerLightFieldTextures: [null, null, null] as [null, null, null],
      gpuChunks: null,
      lightFieldTextureSize: { width: 0, height: 0 },
      lightFieldGridSize: { widthCells: 0, heightCells: 0 },
      textureLayoutChanged: false,
    }
  }

  const widthCells = bounds.maxCellX - bounds.minCellX + 1
  const heightCells = bounds.maxCellZ - bounds.minCellZ + 1
  const textureWidth = widthCells + 1
  const textureHeight = heightCells + 1
  const nextGpuChunks = buildGpuChunkTextureLayout(chunks, chunkSize)
  const canReuseChunkLayout = canReuseChunkTextureLayout(cachedField, nextGpuChunks, useFlickerTextures)
  const layerCount = Math.max(chunks.length, 1)
  const layerDataSize = nextGpuChunks.textureSize.width * nextGpuChunks.textureSize.height * 4 * layerCount

  const lightFieldTexture = canReuseChunkLayout && cachedField?.lightFieldTexture && isChunkedLightFieldTexture(cachedField.lightFieldTexture)
    ? cachedField.lightFieldTexture
    : createLightFieldArrayTexture(
      new Float32Array(layerDataSize),
      nextGpuChunks.textureSize.width,
      nextGpuChunks.textureSize.height,
      layerCount,
    )
  const flickerLightFieldTextures = useFlickerTextures
    ? ([
      canReuseChunkLayout && cachedField?.flickerLightFieldTextures[0] && isChunkedLightFieldTexture(cachedField.flickerLightFieldTextures[0])
        ? cachedField.flickerLightFieldTextures[0]
        : createLightFieldArrayTexture(
          new Float32Array(layerDataSize),
          nextGpuChunks.textureSize.width,
          nextGpuChunks.textureSize.height,
          layerCount,
        ),
      canReuseChunkLayout && cachedField?.flickerLightFieldTextures[1] && isChunkedLightFieldTexture(cachedField.flickerLightFieldTextures[1])
        ? cachedField.flickerLightFieldTextures[1]
        : createLightFieldArrayTexture(
          new Float32Array(layerDataSize),
          nextGpuChunks.textureSize.width,
          nextGpuChunks.textureSize.height,
          layerCount,
        ),
      canReuseChunkLayout && cachedField?.flickerLightFieldTextures[2] && isChunkedLightFieldTexture(cachedField.flickerLightFieldTextures[2])
        ? cachedField.flickerLightFieldTextures[2]
        : createLightFieldArrayTexture(
          new Float32Array(layerDataSize),
          nextGpuChunks.textureSize.width,
          nextGpuChunks.textureSize.height,
          layerCount,
        ),
    ] as [THREE.DataArrayTexture, THREE.DataArrayTexture, THREE.DataArrayTexture])
    : [null, null, null] as [null, null, null]
  const lookupTexture = canReuseChunkLayout && cachedField?.gpuChunks?.lookupTexture
    ? cachedField.gpuChunks.lookupTexture
    : createChunkLayerLookupTexture(nextGpuChunks)

  if (!canReuseChunkLayout && cachedField?.gpuChunks) {
    copyChunkTextureLayerOverlap({
      sourceTexture: cachedField.lightFieldTexture,
      sourceLayerByChunkKey: cachedField.gpuChunks.layerByChunkKey,
      targetTexture: lightFieldTexture,
      targetLayerByChunkKey: nextGpuChunks.layerByChunkKey,
      textureSize: nextGpuChunks.textureSize,
    })
    flickerLightFieldTextures.forEach((texture, index) => {
      if (!texture) {
        return
      }
      copyChunkTextureLayerOverlap({
        sourceTexture: cachedField.flickerLightFieldTextures[index],
        sourceLayerByChunkKey: cachedField.gpuChunks?.layerByChunkKey ?? {},
        targetTexture: texture,
        targetLayerByChunkKey: nextGpuChunks.layerByChunkKey,
        textureSize: nextGpuChunks.textureSize,
      })
    })
  }

  return {
    lightFieldTexture,
    flickerLightFieldTextures,
    gpuChunks: {
      ...nextGpuChunks,
      lookupTexture,
    },
    lightFieldTextureSize: {
      width: textureWidth,
      height: textureHeight,
    },
    lightFieldGridSize: {
      widthCells,
      heightCells,
    },
    textureLayoutChanged: !canReuseChunkLayout,
  }
}

function buildGpuChunkTextureLayout(
  chunks: Array<Omit<BakedLightChunk, 'dirty'>>,
  chunkSize: number,
): Omit<BakedFloorLightFieldGpuChunks, 'lookupTexture'> {
  const sortedChunks = [...chunks].sort((left, right) => left.chunkZ - right.chunkZ || left.chunkX - right.chunkX)
  if (sortedChunks.length === 0) {
    return {
      lookupBounds: null,
      lookupSize: { width: 0, height: 0 },
      textureSize: { width: chunkSize + 1, height: chunkSize + 1 },
      gridSize: { widthCells: chunkSize, heightCells: chunkSize },
      layerByChunkKey: {},
    }
  }

  const lookupBounds = {
    minChunkX: Math.min(...sortedChunks.map((chunk) => chunk.chunkX)),
    maxChunkX: Math.max(...sortedChunks.map((chunk) => chunk.chunkX)),
    minChunkZ: Math.min(...sortedChunks.map((chunk) => chunk.chunkZ)),
    maxChunkZ: Math.max(...sortedChunks.map((chunk) => chunk.chunkZ)),
  }

  return {
    lookupBounds,
    lookupSize: {
      width: lookupBounds.maxChunkX - lookupBounds.minChunkX + 1,
      height: lookupBounds.maxChunkZ - lookupBounds.minChunkZ + 1,
    },
    textureSize: { width: chunkSize + 1, height: chunkSize + 1 },
    gridSize: { widthCells: chunkSize, heightCells: chunkSize },
    layerByChunkKey: Object.fromEntries(
      sortedChunks.map((chunk, index) => [chunk.key, index]),
    ),
  }
}

function canReuseChunkTextureLayout(
  cachedField: BakedFloorLightField | null,
  nextGpuChunks: Omit<BakedFloorLightFieldGpuChunks, 'lookupTexture'>,
  useFlickerTextures: boolean,
) {
  if (
    !cachedField?.gpuChunks
    || !cachedField.lightFieldTexture
    || !isChunkedLightFieldTexture(cachedField.lightFieldTexture)
    || hasFlickerTextureTopologyChanged(cachedField, useFlickerTextures)
  ) {
    return false
  }

  const cachedGpuChunks = cachedField.gpuChunks
  if (!cachedGpuChunks.lookupTexture || !areChunkLookupBoundsEqual(cachedGpuChunks.lookupBounds, nextGpuChunks.lookupBounds)) {
    return false
  }

  if (
    cachedGpuChunks.lookupSize.width !== nextGpuChunks.lookupSize.width
    || cachedGpuChunks.lookupSize.height !== nextGpuChunks.lookupSize.height
    || cachedGpuChunks.textureSize.width !== nextGpuChunks.textureSize.width
    || cachedGpuChunks.textureSize.height !== nextGpuChunks.textureSize.height
    || cachedGpuChunks.gridSize.widthCells !== nextGpuChunks.gridSize.widthCells
    || cachedGpuChunks.gridSize.heightCells !== nextGpuChunks.gridSize.heightCells
  ) {
    return false
  }

  const cachedLayerEntries = Object.entries(cachedGpuChunks.layerByChunkKey).sort(([left], [right]) => left.localeCompare(right))
  const nextLayerEntries = Object.entries(nextGpuChunks.layerByChunkKey).sort(([left], [right]) => left.localeCompare(right))
  if (cachedLayerEntries.length !== nextLayerEntries.length) {
    return false
  }

  return cachedLayerEntries.every(([cachedKey, cachedLayer], index) => {
    const [nextKey, nextLayer] = nextLayerEntries[index]!
    return cachedKey === nextKey && cachedLayer === nextLayer
  })
}

function areChunkLookupBoundsEqual(
  left: BakedFloorLightFieldGpuChunks['lookupBounds'],
  right: BakedFloorLightFieldGpuChunks['lookupBounds'],
) {
  if (!left || !right) {
    return left === right
  }

  return left.minChunkX === right.minChunkX
    && left.maxChunkX === right.maxChunkX
    && left.minChunkZ === right.minChunkZ
    && left.maxChunkZ === right.maxChunkZ
}

function createChunkLayerLookupTexture(
  gpuChunks: Omit<BakedFloorLightFieldGpuChunks, 'lookupTexture'>,
) {
  if (!gpuChunks.lookupBounds) {
    return null
  }

  const data = new Float32Array(gpuChunks.lookupSize.width * gpuChunks.lookupSize.height * 4)
  Object.entries(gpuChunks.layerByChunkKey).forEach(([chunkKey, layerIndex]) => {
    const [chunkX, chunkZ] = chunkKey.split(':').map((value) => Number.parseInt(value, 10))
    const textureIndex = (
      (chunkZ - gpuChunks.lookupBounds!.minChunkZ) * gpuChunks.lookupSize.width
      + (chunkX - gpuChunks.lookupBounds!.minChunkX)
    ) * 4
    data[textureIndex] = layerIndex + 1
    data[textureIndex + 3] = 1
  })

  return createLightFieldTexture(data, gpuChunks.lookupSize.width, gpuChunks.lookupSize.height)
}

function copyChunkTextureLayerOverlap({
  sourceTexture,
  sourceLayerByChunkKey,
  targetTexture,
  targetLayerByChunkKey,
  textureSize,
}: {
  sourceTexture: BakedLightFieldTexture | null
  sourceLayerByChunkKey: Record<string, number>
  targetTexture: BakedLightFieldTexture | null
  targetLayerByChunkKey: Record<string, number>
  textureSize: BakedFloorLightFieldGpuChunks['textureSize']
}) {
  if (!isChunkedLightFieldTexture(sourceTexture) || !isChunkedLightFieldTexture(targetTexture)) {
    return
  }

  if (
    sourceTexture.image.width !== textureSize.width
    || sourceTexture.image.height !== textureSize.height
    || targetTexture.image.width !== textureSize.width
    || targetTexture.image.height !== textureSize.height
  ) {
    return
  }

  const layerStride = textureSize.width * textureSize.height * 4
  const sourceData = sourceTexture.image.data as Float32Array
  const targetData = targetTexture.image.data as Float32Array

  Object.entries(targetLayerByChunkKey).forEach(([chunkKey, targetLayerIndex]) => {
    const sourceLayerIndex = sourceLayerByChunkKey[chunkKey]
    if (sourceLayerIndex === undefined) {
      return
    }

    const sourceOffset = sourceLayerIndex * layerStride
    const targetOffset = targetLayerIndex * layerStride
    targetData.set(sourceData.subarray(sourceOffset, sourceOffset + layerStride), targetOffset)
  })
}

function updateLightFieldTextureChunks({
  bounds,
  chunks,
  chunkSize,
  staticLightSources,
  flickerStaticLightSources,
  occlusion,
  cornerSampleByKey,
  lightFieldTexture,
  flickerLightFieldTextures,
  gpuChunks,
  textureLayoutChanged,
}: {
  bounds: BakedFloorLightField['bounds']
  chunks: Array<Omit<BakedLightChunk, 'dirty'>>
  chunkSize: number
  staticLightSources: ResolvedDungeonLightSource[]
  flickerStaticLightSources: ResolvedDungeonLightSource[]
  occlusion: BakedLightOcclusion | null
  cornerSampleByKey: Record<string, BakedLightCornerSample>
  lightFieldTexture: BakedLightFieldTexture | null
  flickerLightFieldTextures: BakedFloorLightField['flickerLightFieldTextures']
  gpuChunks: BakedFloorLightField['gpuChunks']
  textureLayoutChanged: boolean
}) {
  if (!bounds || !lightFieldTexture || !gpuChunks) {
    return
  }

  const textureData = lightFieldTexture.image.data as Float32Array
  const textureWidth = gpuChunks.textureSize.width
  const dirtyLayerIndices = new Set<number>()

  chunks.forEach((chunk) => {
    const layerIndex = gpuChunks.layerByChunkKey[chunk.key]
    if (layerIndex === undefined) {
      return
    }

    for (let cellZ = chunk.minCellZ; cellZ <= chunk.maxCellZ + 1; cellZ += 1) {
      for (let cellX = chunk.minCellX; cellX <= chunk.maxCellX + 1; cellX += 1) {
        const sample = occlusion && isCornerBlockedBySolidWall(cellX, cellZ, occlusion.cornerBlockingWalls)
          ? ZERO_BAKED_LIGHT_SAMPLE
          : sampleStaticLightAtWorldPosition(
            staticLightSources,
            [cellX * GRID_SIZE, 0, cellZ * GRID_SIZE],
            occlusion,
          )
        cornerSampleByKey[`${cellX}:${cellZ}`] = sample

        const textureIndex = getChunkLayerTextureIndex({
          chunkX: chunk.chunkX,
          chunkZ: chunk.chunkZ,
          chunkSize,
          cellX,
          cellZ,
          textureWidth,
          layerIndex,
          textureHeight: gpuChunks.textureSize.height,
        })
        textureData[textureIndex] = sample[0]
        textureData[textureIndex + 1] = sample[1]
        textureData[textureIndex + 2] = sample[2]
        textureData[textureIndex + 3] = 1

        if (flickerStaticLightSources.length === 0) {
          continue
        }

        const flickerSamples = occlusion && isCornerBlockedBySolidWall(cellX, cellZ, occlusion.cornerBlockingWalls)
          ? [ZERO_BAKED_LIGHT_SAMPLE, ZERO_BAKED_LIGHT_SAMPLE, ZERO_BAKED_LIGHT_SAMPLE] as const
          : sampleFlickerStaticLightBasisCoefficientsAtWorldPosition(
            flickerStaticLightSources,
            [cellX * GRID_SIZE, 0, cellZ * GRID_SIZE],
            occlusion,
          )
        flickerSamples.forEach((flickerSample, bandIndex) => {
          const bandTexture = flickerLightFieldTextures[bandIndex]
          if (!bandTexture) {
            return
          }
          const bandTextureData = bandTexture.image.data as Float32Array
          bandTextureData[textureIndex] = flickerSample[0]
          bandTextureData[textureIndex + 1] = flickerSample[1]
          bandTextureData[textureIndex + 2] = flickerSample[2]
          bandTextureData[textureIndex + 3] = 1
        })
      }
    }

    dirtyLayerIndices.add(layerIndex)
  })

  markChunkTextureUpdate(lightFieldTexture, dirtyLayerIndices, textureLayoutChanged)
  flickerLightFieldTextures.forEach((texture) => {
    if (texture) {
      markChunkTextureUpdate(texture, dirtyLayerIndices, textureLayoutChanged)
    }
  })
}

function applyWorkerCornerUpdatesToTextures({
  bounds,
  cornerUpdates,
  chunkSize,
  lightFieldTexture,
  flickerLightFieldTextures,
  gpuChunks,
  textureLayoutChanged,
}: {
  bounds: BakedFloorLightField['bounds']
  cornerUpdates: BakedFloorLightFieldWorkerResult['cornerUpdates']
  chunkSize: number
  lightFieldTexture: BakedLightFieldTexture | null
  flickerLightFieldTextures: BakedFloorLightField['flickerLightFieldTextures']
  gpuChunks: BakedFloorLightField['gpuChunks']
  textureLayoutChanged: boolean
}) {
  if (!bounds || !lightFieldTexture || !gpuChunks) {
    return
  }

  const textureData = lightFieldTexture.image.data as Float32Array
  const textureWidth = gpuChunks.textureSize.width
  const dirtyLayerIndices = new Set<number>()

  cornerUpdates.forEach(({ cellX, cellZ, sample, flickerBand0, flickerBand1, flickerBand2 }) => {
    const cornerTargets = getChunkLayerTargetsForCorner({
      cellX,
      cellZ,
      chunkSize,
      gpuChunks,
    })
    if (cornerTargets.length === 0) {
      return
    }

    cornerTargets.forEach(({ chunkX, chunkZ, layerIndex }) => {
      const textureIndex = getChunkLayerTextureIndex({
        chunkX,
        chunkZ,
        chunkSize,
        cellX,
        cellZ,
        textureWidth,
        layerIndex,
        textureHeight: gpuChunks.textureSize.height,
      })
      textureData[textureIndex] = sample[0]
      textureData[textureIndex + 1] = sample[1]
      textureData[textureIndex + 2] = sample[2]
      textureData[textureIndex + 3] = 1

      const flickerBand0Texture = flickerLightFieldTextures[0]
      if (flickerBand0Texture && flickerBand0) {
        const flickerBand0Data = flickerBand0Texture.image.data as Float32Array
        flickerBand0Data[textureIndex] = flickerBand0[0]
        flickerBand0Data[textureIndex + 1] = flickerBand0[1]
        flickerBand0Data[textureIndex + 2] = flickerBand0[2]
        flickerBand0Data[textureIndex + 3] = 1
      }

      const flickerBand1Texture = flickerLightFieldTextures[1]
      if (flickerBand1Texture && flickerBand1) {
        const flickerBand1Data = flickerBand1Texture.image.data as Float32Array
        flickerBand1Data[textureIndex] = flickerBand1[0]
        flickerBand1Data[textureIndex + 1] = flickerBand1[1]
        flickerBand1Data[textureIndex + 2] = flickerBand1[2]
        flickerBand1Data[textureIndex + 3] = 1
      }

      const flickerBand2Texture = flickerLightFieldTextures[2]
      if (flickerBand2Texture && flickerBand2) {
        const flickerBand2Data = flickerBand2Texture.image.data as Float32Array
        flickerBand2Data[textureIndex] = flickerBand2[0]
        flickerBand2Data[textureIndex + 1] = flickerBand2[1]
        flickerBand2Data[textureIndex + 2] = flickerBand2[2]
        flickerBand2Data[textureIndex + 3] = 1
      }

      dirtyLayerIndices.add(layerIndex)
    })
  })

  markChunkTextureUpdate(lightFieldTexture, dirtyLayerIndices, textureLayoutChanged)
  flickerLightFieldTextures.forEach((texture) => {
    if (texture) {
      markChunkTextureUpdate(texture, dirtyLayerIndices, textureLayoutChanged)
    }
  })
}

function buildLightFieldSourceHash({
  floorCells,
  staticLightSources,
  occlusion,
  chunkSize,
}: {
  floorCells: GridCell[]
  staticLightSources: ResolvedDungeonLightSource[]
  occlusion: BakedLightOcclusion | null
  chunkSize: number
}) {
  const cacheKey = `${chunkSize}:${getDerivedObjectIdentity(floorCells)}:${getDerivedObjectIdentity(staticLightSources)}:${occlusion ? getDerivedObjectIdentity(occlusion) : 'none'}`
  const cachedHash = bakedLightSourceHashCache.get(cacheKey)
  if (cachedHash) {
    return cachedHash
  }

  const nextHash = [
    BAKED_LIGHT_FIELD_SIGNATURE_VERSION,
    chunkSize,
    floorCells.length,
    staticLightSources.length,
    getDerivedObjectIdentity(floorCells),
    getDerivedObjectIdentity(staticLightSources),
    occlusion ? getDerivedObjectIdentity(occlusion) : 'none',
  ].join(':')
  bakedLightSourceHashCache.set(cacheKey, nextHash)
  return nextHash
}

function sampleFlickerStaticLightBasisCoefficientsAtWorldPosition(
  staticLightSources: ResolvedDungeonLightSource[],
  worldPosition: readonly [number, number, number],
  occlusion: BakedLightOcclusion | null = null,
) {
  const flickerBand0 = [0, 0, 0] as [number, number, number]
  const flickerBand1 = [0, 0, 0] as [number, number, number]
  const flickerBand2 = [0, 0, 0] as [number, number, number]

  staticLightSources.forEach((lightSource) => {
    const dx = lightSource.position[0] - worldPosition[0]
    const dy = lightSource.position[1] - worldPosition[1]
    const dz = lightSource.position[2] - worldPosition[2]
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const falloff = getBakedLightDistanceFalloff(lightSource.light, distance)
    if (falloff <= 0) {
      return
    }
    if (occlusion && !hasBakedLightLineOfSight(lightSource.position, worldPosition, occlusion)) {
      return
    }

    const contribution = lightSource.light.intensity * falloff
    const [coefficient0, coefficient1, coefficient2] = getStableLightFlickerCoefficients(lightSource.key)
    const flickerContribution = contribution * BAKED_FLICKER_COEFFICIENT_SCALE
    flickerBand0[0] += lightSource.linearColor[0] * flickerContribution * coefficient0
    flickerBand0[1] += lightSource.linearColor[1] * flickerContribution * coefficient0
    flickerBand0[2] += lightSource.linearColor[2] * flickerContribution * coefficient0
    flickerBand1[0] += lightSource.linearColor[0] * flickerContribution * coefficient1
    flickerBand1[1] += lightSource.linearColor[1] * flickerContribution * coefficient1
    flickerBand1[2] += lightSource.linearColor[2] * flickerContribution * coefficient1
    flickerBand2[0] += lightSource.linearColor[0] * flickerContribution * coefficient2
    flickerBand2[1] += lightSource.linearColor[1] * flickerContribution * coefficient2
    flickerBand2[2] += lightSource.linearColor[2] * flickerContribution * coefficient2
  })

  return [
    clampSignedBakedLightSample(flickerBand0),
    clampSignedBakedLightSample(flickerBand1),
    clampSignedBakedLightSample(flickerBand2),
  ] as const
}

function clampBakedLightSample([red, green, blue]: readonly [number, number, number]): BakedLightSample {
  const maxChannel = Math.max(red, green, blue)
  if (maxChannel <= DEFAULT_BAKED_LIGHT_CHANNEL_CAP || maxChannel <= 0) {
    return [red, green, blue]
  }

  const scale = DEFAULT_BAKED_LIGHT_CHANNEL_CAP / maxChannel
  return [red * scale, green * scale, blue * scale]
}

function clampSignedBakedLightSample([red, green, blue]: readonly [number, number, number]): BakedLightSample {
  const maxChannel = Math.max(Math.abs(red), Math.abs(green), Math.abs(blue))
  if (maxChannel <= DEFAULT_BAKED_LIGHT_CHANNEL_CAP || maxChannel <= 0) {
    return [red, green, blue]
  }

  const scale = DEFAULT_BAKED_LIGHT_CHANNEL_CAP / maxChannel
  return [red * scale, green * scale, blue * scale]
}

function buildBakedLightOcclusion(
  input: BakedLightOcclusionInput | null | undefined,
): BakedLightOcclusion | null {
  if (!input) {
    return null
  }

  const cacheKey = `${getDerivedObjectIdentity(input.paintedCells)}:${getDerivedObjectIdentity(input.wallOpenings)}:${getDerivedObjectIdentity(input.innerWalls)}:${input.wallSurfaceProps ? getDerivedObjectIdentity(input.wallSurfaceProps) : 'none'}`
  const cachedOcclusion = bakedLightOcclusionCache.get(cacheKey)
  if (cachedOcclusion) {
    return cachedOcclusion
  }

  const openWalls = buildOpenWallSegmentSet(input.wallOpenings, input.wallSurfaceProps)
  const nextOcclusion = {
    paintedCells: input.paintedCells,
    openWalls,
    solidWalls: buildSolidWallSet(input.paintedCells, input.innerWalls, openWalls),
    cornerBlockingWalls: buildCornerBlockingWallSet(input.paintedCells, input.innerWalls, openWalls),
  }
  bakedLightOcclusionCache.set(cacheKey, nextOcclusion)
  return nextOcclusion
}

function getDerivedObjectIdentity(value: object) {
  const cachedIdentity = derivedObjectIdentityCache.get(value)
  if (cachedIdentity) {
    return cachedIdentity
  }

  const nextIdentity = nextDerivedObjectIdentity
  nextDerivedObjectIdentity += 1
  derivedObjectIdentityCache.set(value, nextIdentity)
  return nextIdentity
}

function buildSolidWallSet(
  paintedCells: PaintedCells,
  innerWalls: Record<string, InnerWallRecord>,
  openWalls: ReadonlySet<string>,
) {
  const solidWalls = new Set<string>()

  collectBoundaryWallSegments(paintedCells).forEach((segment) => {
    if (openWalls.has(segment.key)) {
      return
    }

    solidWalls.add(segment.key)
    const mirroredWallKey = getMirroredWallKey(segment.key)
    if (mirroredWallKey && !openWalls.has(mirroredWallKey)) {
      solidWalls.add(mirroredWallKey)
    }
  })

  Object.keys(innerWalls).forEach((wallKey) => {
    if (openWalls.has(wallKey)) {
      return
    }

    solidWalls.add(wallKey)
    const mirroredWallKey = getMirroredWallKey(wallKey)
    if (mirroredWallKey && !openWalls.has(mirroredWallKey)) {
      solidWalls.add(mirroredWallKey)
    }
  })

  return solidWalls
}

function buildCornerBlockingWallSet(
  paintedCells: PaintedCells,
  innerWalls: Record<string, InnerWallRecord>,
  openWalls: ReadonlySet<string>,
) {
  const cornerBlockingWalls = new Set<string>()

  collectBoundaryWallSegments(paintedCells, { interRoomOnly: true }).forEach((segment) => {
    if (openWalls.has(segment.key)) {
      return
    }

    cornerBlockingWalls.add(segment.key)
    const mirroredWallKey = getMirroredWallKey(segment.key)
    if (mirroredWallKey && !openWalls.has(mirroredWallKey)) {
      cornerBlockingWalls.add(mirroredWallKey)
    }
  })

  Object.keys(innerWalls).forEach((wallKey) => {
    if (openWalls.has(wallKey)) {
      return
    }

    cornerBlockingWalls.add(wallKey)
    const mirroredWallKey = getMirroredWallKey(wallKey)
    if (mirroredWallKey && !openWalls.has(mirroredWallKey)) {
      cornerBlockingWalls.add(mirroredWallKey)
    }
  })

  return cornerBlockingWalls
}

function hasBakedLightLineOfSight(
  originWorld: readonly [number, number, number],
  targetWorld: readonly [number, number, number],
  occlusion: BakedLightOcclusion,
) {
  return !doesLineIntersectClosedWall(originWorld, targetWorld, occlusion.solidWalls)
}


function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}
