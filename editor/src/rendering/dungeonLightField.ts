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
import type { ObjectLightOverrides } from '../store/lightOverrides'
import { getObjectLightOverrides, mergePropLightWithOverrides } from '../store/lightOverrides'
import { buildOpenWallSegmentSet } from '../store/openWallSegments'
import { getMirroredWallKey } from '../store/manualWalls'
import { collectBoundaryWallSegments } from '../store/wallSegments'

export const DEFAULT_BAKED_LIGHT_CHUNK_SIZE = 8
export const DEFAULT_DYNAMIC_LIGHT_POOL_SIZE = 32
export const DEFAULT_BAKED_LIGHT_CHANNEL_CAP = 0.9
const BAKED_FLICKER_BAND_COUNT = 3
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
const floorLightFieldCache = new Map<string, BakedFloorLightField>()

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
  lightFieldTexture: THREE.DataTexture | null
  flickerLightFieldTextures: [
    THREE.DataTexture | null,
    THREE.DataTexture | null,
    THREE.DataTexture | null,
  ]
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

export function clearBakedFloorLightFieldCache() {
  floorLightFieldCache.forEach((field) => {
    field.lightFieldTexture?.dispose()
    field.flickerLightFieldTextures.forEach((texture) => texture?.dispose())
  })
  floorLightFieldCache.clear()
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

export function getOrBuildBakedFloorLightField({
  floorId,
  floorCells,
  staticLightSources,
  occlusionInput,
  chunkSize = DEFAULT_BAKED_LIGHT_CHUNK_SIZE,
}: {
  floorId: string
  floorCells: GridCell[]
  staticLightSources: ResolvedDungeonLightSource[]
  occlusionInput?: BakedLightOcclusionInput | null
  chunkSize?: number
}) {
  const occlusion = buildBakedLightOcclusion(occlusionInput)
  const sourceHash = buildLightFieldSourceHash({
    floorCells,
    staticLightSources,
    occlusion,
    chunkSize,
  })
  const cached = floorLightFieldCache.get(floorId)
  if (cached?.sourceHash === sourceHash) {
    return cached
  }
  const occlusionChanged = cached
    ? hasBakedLightOcclusionChanged(cached.occlusion, occlusion)
    : false
  const dirtyChunkKeys = cached
    ? occlusionChanged
      ? null
      : getDirtyChunkKeys({
        previousFloorCells: Object.keys(cached.sampleByCellKey),
        nextFloorCells: floorCells.map((cell) => getCellKey(cell)),
        previousLightSources: cached.staticLightSources,
        nextLightSources: staticLightSources,
        chunkSize,
      })
    : null

  const next = buildBakedFloorLightField({
    floorId,
    floorCells,
    staticLightSources,
    occlusion,
    cachedField: cached ?? null,
    chunkSize,
    dirtyChunkKeys,
    previousSourceHash: cached?.sourceHash ?? null,
    sourceHash,
  })
  if (cached && cached !== next) {
    if (cached.lightFieldTexture !== next.lightFieldTexture) {
      cached.lightFieldTexture?.dispose()
    }
    cached.flickerLightFieldTextures.forEach((texture, index) => {
      if (texture !== next.flickerLightFieldTextures[index]) {
        texture?.dispose()
      }
    })
  }
  floorLightFieldCache.set(floorId, next)
  return next
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
  const directionalVector = new THREE.Vector3(
    getBakedLightLuminance(eastLight) - getBakedLightLuminance(westLight),
    averageLuminance * 0.18,
    getBakedLightLuminance(southLight) - getBakedLightLuminance(northLight),
  )
  const directionalStrength = Math.min(
    directionalVector.length() / Math.max(averageLuminance * 1.35, 0.08),
    1,
  )
  const lightDirection = directionalVector.lengthSq() > 1e-6
    ? directionalVector.normalize().toArray() as [number, number, number]
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

export function getStableLightPhase(key: string) {
  let hash = 2166136261
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0) / 4294967296 * Math.PI * 2
}

function getBakedLightLuminance(sample: BakedLightSample) {
  return sample[0] * 0.2126 + sample[1] * 0.7152 + sample[2] * 0.0722
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
  const chunkKeys = new Set(chunkBuilders.keys())
  const needsFullChunkRebuild = !canReuseBakedLightLayout(cachedField, bounds)
    || hasFlickerTextureTopologyChanged(cachedField, flickerStaticLightSources.length > 0)
  const effectiveDirtyChunkKeys = needsFullChunkRebuild
    ? chunkKeys
    : dirtyChunkKeys ?? chunkKeys
  const sampleByCellKey: Record<string, BakedLightSample> = canReuseBakedLightLayout(cachedField, bounds)
    ? { ...cachedField!.sampleByCellKey }
    : {}
  Object.keys(sampleByCellKey).forEach((cellKey) => {
    if (!uniqueCellKeys.has(cellKey)) {
      delete sampleByCellKey[cellKey]
    }
  })
  const cornerSampleByKey: Record<string, BakedLightCornerSample> = canReuseBakedLightLayout(cachedField, bounds)
    ? { ...cachedField!.cornerSampleByKey }
    : {}
  const { lightFieldTexture, flickerLightFieldTextures, lightFieldTextureSize, lightFieldGridSize } = prepareLightFieldTextures({
    bounds,
    cachedField,
    useFlickerTextures: flickerStaticLightSources.length > 0,
  })

  ;[...chunkBuilders.values()].forEach((chunk) => {
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
    chunks: [...chunkBuilders.values()].filter((chunk) => effectiveDirtyChunkKeys.has(chunk.key)),
    staticLightSources,
    flickerStaticLightSources,
    occlusion,
    cornerSampleByKey,
    lightFieldTexture,
    flickerLightFieldTextures,
  })

  return {
    floorId,
    chunkSize,
    bounds,
    staticLightSources,
    staticLightSourcesByChunkKey,
    occlusion,
    chunks: [...chunkBuilders.values()]
      .map((chunk) => ({
        ...chunk,
        dirty: effectiveDirtyChunkKeys.has(chunk.key),
      }))
      .sort((left, right) => left.chunkZ - right.chunkZ || left.chunkX - right.chunkX),
    dirtyChunkKeys: [...effectiveDirtyChunkKeys].sort(),
    dirtyChunkKeySet: effectiveDirtyChunkKeys,
    lightFieldTexture,
    flickerLightFieldTextures,
    lightFieldTextureSize,
    lightFieldGridSize,
    cornerSampleByKey,
    sampleByCellKey,
    previousSourceHash,
    sourceHash,
  } satisfies BakedFloorLightField
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

function canReuseBakedLightLayout(
  cachedField: BakedFloorLightField | null,
  bounds: BakedFloorLightField['bounds'],
) {
  if (!cachedField?.bounds || !bounds) {
    return cachedField?.bounds === bounds
  }

  return cachedField.bounds.minCellX === bounds.minCellX
    && cachedField.bounds.maxCellX === bounds.maxCellX
    && cachedField.bounds.minCellZ === bounds.minCellZ
    && cachedField.bounds.maxCellZ === bounds.maxCellZ
}

function hasFlickerTextureTopologyChanged(
  cachedField: BakedFloorLightField | null,
  useFlickerTextures: boolean,
) {
  const cachedHasFlickerTextures = Boolean(cachedField?.flickerLightFieldTextures.some((texture) => texture))
  return cachedHasFlickerTextures !== useFlickerTextures
}

function hasBakedLightOcclusionChanged(
  previousOcclusion: BakedLightOcclusion | null,
  nextOcclusion: BakedLightOcclusion | null,
) {
  if (previousOcclusion === nextOcclusion) {
    return false
  }
  if (!previousOcclusion || !nextOcclusion) {
    return previousOcclusion !== nextOcclusion
  }

  return !areStringSetsEqual(previousOcclusion.openWalls, nextOcclusion.openWalls)
    || !areStringSetsEqual(previousOcclusion.solidWalls, nextOcclusion.solidWalls)
}

function areStringSetsEqual(left: ReadonlySet<string>, right: ReadonlySet<string>) {
  if (left.size !== right.size) {
    return false
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false
    }
  }

  return true
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

function prepareLightFieldTextures({
  bounds,
  cachedField,
  useFlickerTextures,
}: {
  bounds: BakedFloorLightField['bounds']
  cachedField: BakedFloorLightField | null
  useFlickerTextures: boolean
}): Pick<
  BakedFloorLightField,
  'lightFieldTexture' | 'flickerLightFieldTextures' | 'lightFieldTextureSize' | 'lightFieldGridSize'
> {
  if (!bounds) {
    return {
      lightFieldTexture: null,
      flickerLightFieldTextures: [null, null, null] as [null, null, null],
      lightFieldTextureSize: { width: 0, height: 0 },
      lightFieldGridSize: { widthCells: 0, heightCells: 0 },
    }
  }

  const widthCells = bounds.maxCellX - bounds.minCellX + 1
  const heightCells = bounds.maxCellZ - bounds.minCellZ + 1
  const textureWidth = widthCells + 1
  const textureHeight = heightCells + 1
  const canReuseLayout = canReuseBakedLightLayout(cachedField, bounds)
  const lightFieldTexture = canReuseLayout && cachedField?.lightFieldTexture
    ? cachedField.lightFieldTexture
    : createLightFieldTexture(new Float32Array(textureWidth * textureHeight * 4), textureWidth, textureHeight)
  const flickerLightFieldTextures = useFlickerTextures
    ? (canReuseLayout && !hasFlickerTextureTopologyChanged(cachedField, true)
      ? cachedField!.flickerLightFieldTextures
      : [
        createLightFieldTexture(new Float32Array(textureWidth * textureHeight * 4), textureWidth, textureHeight),
        createLightFieldTexture(new Float32Array(textureWidth * textureHeight * 4), textureWidth, textureHeight),
        createLightFieldTexture(new Float32Array(textureWidth * textureHeight * 4), textureWidth, textureHeight),
      ] as [THREE.DataTexture, THREE.DataTexture, THREE.DataTexture])
    : [null, null, null] as [null, null, null]

  return {
    lightFieldTexture,
    flickerLightFieldTextures,
    lightFieldTextureSize: {
      width: textureWidth,
      height: textureHeight,
    },
    lightFieldGridSize: {
      widthCells,
      heightCells,
    },
  }
}

function updateLightFieldTextureChunks({
  bounds,
  chunks,
  staticLightSources,
  flickerStaticLightSources,
  occlusion,
  cornerSampleByKey,
  lightFieldTexture,
  flickerLightFieldTextures,
}: {
  bounds: BakedFloorLightField['bounds']
  chunks: Array<Omit<BakedLightChunk, 'dirty'>>
  staticLightSources: ResolvedDungeonLightSource[]
  flickerStaticLightSources: ResolvedDungeonLightSource[]
  occlusion: BakedLightOcclusion | null
  cornerSampleByKey: Record<string, BakedLightCornerSample>
  lightFieldTexture: THREE.DataTexture | null
  flickerLightFieldTextures: BakedFloorLightField['flickerLightFieldTextures']
}) {
  if (!bounds || !lightFieldTexture) {
    return
  }

  const textureData = lightFieldTexture.image.data as Float32Array
  const textureWidth = bounds.maxCellX - bounds.minCellX + 2

  chunks.forEach((chunk) => {
    for (let cellZ = chunk.minCellZ; cellZ <= chunk.maxCellZ + 1; cellZ += 1) {
      for (let cellX = chunk.minCellX; cellX <= chunk.maxCellX + 1; cellX += 1) {
        const sample = occlusion && isCornerBlockedBySolidWall(cellX, cellZ, occlusion.solidWalls)
          ? ZERO_BAKED_LIGHT_SAMPLE
          : sampleStaticLightAtWorldPosition(
            staticLightSources,
            [cellX * GRID_SIZE, 0, cellZ * GRID_SIZE],
            occlusion,
          )
        cornerSampleByKey[`${cellX}:${cellZ}`] = sample

        const textureIndex = ((cellZ - bounds.minCellZ) * textureWidth + (cellX - bounds.minCellX)) * 4
        textureData[textureIndex] = sample[0]
        textureData[textureIndex + 1] = sample[1]
        textureData[textureIndex + 2] = sample[2]
        textureData[textureIndex + 3] = 1

        if (flickerStaticLightSources.length === 0) {
          continue
        }

        const flickerSamples = occlusion && isCornerBlockedBySolidWall(cellX, cellZ, occlusion.solidWalls)
          ? [ZERO_BAKED_LIGHT_SAMPLE, ZERO_BAKED_LIGHT_SAMPLE, ZERO_BAKED_LIGHT_SAMPLE] as const
          : sampleFlickerStaticLightBandsAtWorldPosition(
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
  })

  lightFieldTexture.needsUpdate = true
  flickerLightFieldTextures.forEach((texture) => {
    if (texture) {
      texture.needsUpdate = true
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
  const floorCellKeys = Array.from(new Set(floorCells.map((cell) => getCellKey(cell)))).sort()
  const serialized = JSON.stringify({
    chunkSize,
    floorCellKeys,
    staticLightSources: staticLightSources
      .map((lightSource) => ({
        key: lightSource.key,
        position: lightSource.position,
        color: lightSource.light.color,
        intensity: lightSource.light.intensity,
        distance: lightSource.light.distance,
        decay: lightSource.light.decay ?? 2,
        flicker: Boolean(lightSource.light.flicker),
        }))
      .sort((left, right) => left.key.localeCompare(right.key)),
    openWalls: occlusion ? [...occlusion.openWalls].sort() : [],
    solidWalls: occlusion ? [...occlusion.solidWalls].sort() : [],
  })

  let hash = 2166136261
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16)
}

function sampleFlickerStaticLightBandsAtWorldPosition(
  staticLightSources: ResolvedDungeonLightSource[],
  worldPosition: readonly [number, number, number],
  occlusion: BakedLightOcclusion | null = null,
) {
  const bands = Array.from({ length: BAKED_FLICKER_BAND_COUNT }, () => [0, 0, 0]) as [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ]

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
    const band = getStableLightBand(lightSource.key)
    bands[band][0] += lightSource.linearColor[0] * contribution
    bands[band][1] += lightSource.linearColor[1] * contribution
    bands[band][2] += lightSource.linearColor[2] * contribution
  })

  const band0: BakedLightSample = clampBakedLightSample(bands[0])
  const band1: BakedLightSample = clampBakedLightSample(bands[1])
  const band2: BakedLightSample = clampBakedLightSample(bands[2])

  return [band0, band1, band2]
}

function clampBakedLightSample([red, green, blue]: readonly [number, number, number]): BakedLightSample {
  const maxChannel = Math.max(red, green, blue)
  if (maxChannel <= DEFAULT_BAKED_LIGHT_CHANNEL_CAP || maxChannel <= 0) {
    return [red, green, blue]
  }

  const scale = DEFAULT_BAKED_LIGHT_CHANNEL_CAP / maxChannel
  return [red * scale, green * scale, blue * scale]
}

function getStableLightBand(key: string) {
  let hash = 2166136261
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0) % BAKED_FLICKER_BAND_COUNT
}

function buildBakedLightOcclusion(
  input: BakedLightOcclusionInput | null | undefined,
): BakedLightOcclusion | null {
  if (!input) {
    return null
  }

  const openWalls = buildOpenWallSegmentSet(input.wallOpenings, input.wallSurfaceProps)
  return {
    paintedCells: input.paintedCells,
    openWalls,
    solidWalls: buildSolidWallSet(input.paintedCells, input.innerWalls, openWalls),
  }
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

function hasBakedLightLineOfSight(
  originWorld: readonly [number, number, number],
  targetWorld: readonly [number, number, number],
  occlusion: BakedLightOcclusion,
) {
  return !doesLineIntersectClosedWall(originWorld, targetWorld, occlusion.solidWalls)
}

function doesLineIntersectClosedWall(
  originWorld: readonly [number, number, number],
  targetWorld: readonly [number, number, number],
  closedWalls: ReadonlySet<string>,
) {
  for (const wallKey of closedWalls) {
    const wallSegment = getWallWorldSegment(wallKey)
    if (!wallSegment) {
      continue
    }

    if (doesWorldLineIntersectWallSegment(originWorld, targetWorld, wallSegment)) {
      return true
    }
  }

  return false
}

function isCornerBlockedBySolidWall(
  cornerCellX: number,
  cornerCellZ: number,
  solidWalls: ReadonlySet<string>,
) {
  return solidWalls.has(`${cornerCellX}:${cornerCellZ}:south`)
    || solidWalls.has(`${cornerCellX}:${cornerCellZ}:west`)
    || solidWalls.has(`${cornerCellX - 1}:${cornerCellZ}:east`)
    || solidWalls.has(`${cornerCellX}:${cornerCellZ - 1}:north`)
}

function doesWorldLineIntersectWallSegment(
  originWorld: readonly [number, number, number],
  targetWorld: readonly [number, number, number],
  wallSegment: readonly [number, number, number, number],
) {
  const [wallStartX, wallStartZ, wallEndX, wallEndZ] = wallSegment
  const originX = originWorld[0]
  const originZ = originWorld[2]
  const targetX = targetWorld[0]
  const targetZ = targetWorld[2]
  const dx = targetX - originX
  const dz = targetZ - originZ
  const epsilon = 1e-5

  if (Math.abs(wallStartX - wallEndX) <= epsilon) {
    if (Math.abs(dx) <= epsilon) {
      return false
    }

    const t = (wallStartX - originX) / dx
    if (t <= epsilon || t >= 1 - epsilon) {
      return false
    }

    const intersectionZ = originZ + dz * t
    const minWallZ = Math.min(wallStartZ, wallEndZ)
    const maxWallZ = Math.max(wallStartZ, wallEndZ)
    return intersectionZ >= minWallZ - epsilon && intersectionZ <= maxWallZ + epsilon
  }

  if (Math.abs(dz) <= epsilon) {
    return false
  }

  const t = (wallStartZ - originZ) / dz
  if (t <= epsilon || t >= 1 - epsilon) {
    return false
  }

  const intersectionX = originX + dx * t
  const minWallX = Math.min(wallStartX, wallEndX)
  const maxWallX = Math.max(wallStartX, wallEndX)
  return intersectionX >= minWallX - epsilon && intersectionX <= maxWallX + epsilon
}

function getWallWorldSegment(wallKey: string): readonly [number, number, number, number] | null {
  const [rawCellX, rawCellZ, direction] = wallKey.split(':')
  const cellX = Number.parseInt(rawCellX ?? '', 10)
  const cellZ = Number.parseInt(rawCellZ ?? '', 10)
  if (!Number.isFinite(cellX) || !Number.isFinite(cellZ)) {
    return null
  }

  switch (direction) {
    case 'north':
      return [
        cellX * GRID_SIZE,
        (cellZ + 1) * GRID_SIZE,
        (cellX + 1) * GRID_SIZE,
        (cellZ + 1) * GRID_SIZE,
      ]
    case 'south':
      return [
        cellX * GRID_SIZE,
        cellZ * GRID_SIZE,
        (cellX + 1) * GRID_SIZE,
        cellZ * GRID_SIZE,
      ]
    case 'east':
      return [
        (cellX + 1) * GRID_SIZE,
        cellZ * GRID_SIZE,
        (cellX + 1) * GRID_SIZE,
        (cellZ + 1) * GRID_SIZE,
      ]
    case 'west':
      return [
        cellX * GRID_SIZE,
        cellZ * GRID_SIZE,
        cellX * GRID_SIZE,
        (cellZ + 1) * GRID_SIZE,
      ]
    default:
      return null
  }
}


function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}
