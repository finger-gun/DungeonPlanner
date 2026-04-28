import * as THREE from 'three'
import { getContentPackAssetById } from '../content-packs/registry'
import type { PropLight } from '../content-packs/types'
import { cellToWorldPosition, getCellKey, GRID_SIZE, type GridCell } from '../hooks/useSnapToGrid'
import type { RegisteredLightSource } from '../components/canvas/objectSourceRegistry'
import type { DungeonObjectRecord } from '../store/useDungeonStore'
import type { ObjectLightOverrides } from '../store/lightOverrides'
import { getObjectLightOverrides, mergePropLightWithOverrides } from '../store/lightOverrides'

export const DEFAULT_BAKED_LIGHT_CHUNK_SIZE = 8
export const DEFAULT_DYNAMIC_LIGHT_POOL_SIZE = 32
export const DEFAULT_BAKED_LIGHT_CHANNEL_CAP = 1.25

const ZERO_BAKED_LIGHT_SAMPLE = [0, 0, 0] as const
const positionScratch = new THREE.Vector3()
const offsetScratch = new THREE.Vector3()
const rotationScratch = new THREE.Euler()
const sphereScratch = new THREE.Sphere()
const colorScratch = new THREE.Color()
const floorLightFieldCache = new Map<string, BakedFloorLightField>()

export type BakedLightSample = readonly [number, number, number]
export type BakedLightCornerSample = readonly [number, number, number]

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
  chunks: BakedLightChunk[]
  dirtyChunkKeys: string[]
  lightFieldTexture: THREE.DataTexture | null
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
  sourceHash: string
}

export function clearBakedFloorLightFieldCache() {
  floorLightFieldCache.forEach((field) => field.lightFieldTexture?.dispose())
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
  chunkSize = DEFAULT_BAKED_LIGHT_CHUNK_SIZE,
}: {
  floorId: string
  floorCells: GridCell[]
  staticLightSources: ResolvedDungeonLightSource[]
  chunkSize?: number
}) {
  const sourceHash = buildLightFieldSourceHash({
    floorCells,
    staticLightSources,
    chunkSize,
  })
  const cached = floorLightFieldCache.get(floorId)
  if (cached?.sourceHash === sourceHash) {
    return cached
  }
  const dirtyChunkKeys = cached
    ? getDirtyChunkKeys({
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
    chunkSize,
    dirtyChunkKeys,
    sourceHash,
  })
  if (cached && cached !== next && cached.lightFieldTexture !== next.lightFieldTexture) {
    cached.lightFieldTexture?.dispose()
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

export function sampleStaticLightAtWorldPosition(
  staticLightSources: ResolvedDungeonLightSource[],
  worldPosition: readonly [number, number, number],
): BakedLightSample {
  let red = 0
  let green = 0
  let blue = 0

  staticLightSources.forEach((lightSource) => {
    const dx = lightSource.position[0] - worldPosition[0]
    const dy = lightSource.position[1] - worldPosition[1]
    const dz = lightSource.position[2] - worldPosition[2]
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const falloff = getLightDistanceFalloff(lightSource.light, distance)
    if (falloff <= 0) {
      return
    }

    const intensity = lightSource.light.intensity * falloff
    red += lightSource.linearColor[0] * intensity
    green += lightSource.linearColor[1] * intensity
    blue += lightSource.linearColor[2] * intensity
  })

  return [
    Math.min(red, DEFAULT_BAKED_LIGHT_CHANNEL_CAP),
    Math.min(green, DEFAULT_BAKED_LIGHT_CHANNEL_CAP),
    Math.min(blue, DEFAULT_BAKED_LIGHT_CHANNEL_CAP),
  ]
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
  chunkSize,
  dirtyChunkKeys,
  sourceHash,
}: {
  floorId: string
  floorCells: GridCell[]
  staticLightSources: ResolvedDungeonLightSource[]
  chunkSize: number
  dirtyChunkKeys: Set<string> | null
  sourceHash: string
}) {
  const sampleByCellKey: Record<string, BakedLightSample> = {}
  const cornerSampleByKey: Record<string, BakedLightCornerSample> = {}
  const chunkBuilders = new Map<string, Omit<BakedLightChunk, 'dirty'>>()
  const uniqueCellKeys = new Set<string>()

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

    sampleByCellKey[cellKey] = sampleStaticLightAtWorldPosition(staticLightSources, cellToWorldPosition(cell))

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
  const { lightFieldTexture, lightFieldTextureSize, lightFieldGridSize } = buildLightFieldTexture(
    bounds,
    staticLightSources,
    cornerSampleByKey,
  )

  return {
    floorId,
    chunkSize,
    bounds,
    staticLightSources,
    chunks: [...chunkBuilders.values()]
      .map((chunk) => ({
        ...chunk,
        dirty: dirtyChunkKeys?.has(chunk.key) ?? true,
      }))
      .sort((left, right) => left.chunkZ - right.chunkZ || left.chunkX - right.chunkX),
    dirtyChunkKeys: [...(dirtyChunkKeys ?? new Set(chunkBuilders.keys()))].sort(),
    lightFieldTexture,
    lightFieldTextureSize,
    lightFieldGridSize,
    cornerSampleByKey,
    sampleByCellKey,
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

function getChunkKeyForCellKey(cellKey: string, chunkSize: number) {
  const [cellX, cellZ] = cellKey.split(':').map((value) => Number.parseInt(value, 10))
  return getChunkKeyForCell(cellX, cellZ, chunkSize)
}

function getChunkKeyForCell(cellX: number, cellZ: number, chunkSize: number) {
  return `${Math.floor(cellX / chunkSize)}:${Math.floor(cellZ / chunkSize)}`
}

function buildLightFieldTexture(
  bounds: BakedFloorLightField['bounds'],
  staticLightSources: ResolvedDungeonLightSource[],
  cornerSampleByKey: Record<string, BakedLightCornerSample>,
) {
  if (!bounds) {
    return {
      lightFieldTexture: null,
      lightFieldTextureSize: { width: 0, height: 0 },
      lightFieldGridSize: { widthCells: 0, heightCells: 0 },
    }
  }

  const widthCells = bounds.maxCellX - bounds.minCellX + 1
  const heightCells = bounds.maxCellZ - bounds.minCellZ + 1
  const textureWidth = widthCells + 1
  const textureHeight = heightCells + 1
  const textureData = new Float32Array(textureWidth * textureHeight * 4)

  for (let cornerZ = 0; cornerZ <= heightCells; cornerZ += 1) {
    for (let cornerX = 0; cornerX <= widthCells; cornerX += 1) {
      const cellX = bounds.minCellX + cornerX
      const cellZ = bounds.minCellZ + cornerZ
      const sample = sampleStaticLightAtWorldPosition(
        staticLightSources,
        [cellX * GRID_SIZE, 0, cellZ * GRID_SIZE],
      )
      cornerSampleByKey[`${cellX}:${cellZ}`] = sample

      const textureIndex = (cornerZ * textureWidth + cornerX) * 4
      textureData[textureIndex] = sample[0]
      textureData[textureIndex + 1] = sample[1]
      textureData[textureIndex + 2] = sample[2]
      textureData[textureIndex + 3] = 1
    }
  }

  const lightFieldTexture = new THREE.DataTexture(
    textureData,
    textureWidth,
    textureHeight,
    THREE.RGBAFormat,
    THREE.FloatType,
  )
  lightFieldTexture.wrapS = THREE.ClampToEdgeWrapping
  lightFieldTexture.wrapT = THREE.ClampToEdgeWrapping
  lightFieldTexture.minFilter = THREE.NearestFilter
  lightFieldTexture.magFilter = THREE.NearestFilter
  lightFieldTexture.generateMipmaps = false
  lightFieldTexture.needsUpdate = true

  return {
    lightFieldTexture,
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

function buildLightFieldSourceHash({
  floorCells,
  staticLightSources,
  chunkSize,
}: {
  floorCells: GridCell[]
  staticLightSources: ResolvedDungeonLightSource[]
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
      }))
      .sort((left, right) => left.key.localeCompare(right.key)),
  })

  let hash = 2166136261
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16)
}
