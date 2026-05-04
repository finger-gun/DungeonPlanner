import { shouldRenderLineOfSightGeometry } from './losRendering'
import type { StaticTileEntry } from './tileEntries'
import { resolveBatchedTileAsset, type ResolvedBatchedTileAsset } from './tileAssetResolution'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import {
  DEFAULT_FLOOR_RENDER_CHUNK_SIZE,
  getFloorChunkKeyForCell,
} from '../../store/floorChunkKeys'

export type ResolvedStaticTileEntry = StaticTileEntry & ResolvedBatchedTileAsset

export const DEFAULT_RENDER_BATCH_CHUNK_SIZE = DEFAULT_FLOOR_RENDER_CHUNK_SIZE

export type BatchDescriptor = {
  floorId: string
  bucketKey: string
  chunkKey: string
  entries: ResolvedStaticTileEntry[]
  assetUrl: string
  usesGpuFog: boolean
  geometrySignature: string
  renderSignature: string
  variant: StaticTileEntry['variant']
  visibility: StaticTileEntry['visibility']
  receiveShadow: boolean
  useBuildAnimation: boolean
  useBakedLight: boolean
  useBakedFlicker: boolean
  useSecondaryDirectionAttribute: boolean
  shouldRenderBase: boolean
  useLineOfSightPostMask: boolean
}

export type BatchDescriptorBundle = {
  batched: BatchDescriptor[]
  fallback: StaticTileEntry[]
}

export type BuildBatchDescriptorOptions = {
  floorId: string
  fogOfWarEnabled: boolean
  useLineOfSightPostMask: boolean
  lightFlickerEnabled: boolean
}

function shouldUseBatchedGpuFog(
  variant: StaticTileEntry['variant'],
  fogOfWarEnabled: boolean,
) {
  return fogOfWarEnabled && variant === 'floor'
}

function buildBucketKey(
  floorId: string,
  entry: ResolvedStaticTileEntry,
  usesGpuFog: boolean,
  lightFlickerEnabled: boolean,
): string {
  const useBakedFlicker =
    lightFlickerEnabled
    && Boolean(entry.bakedLightField?.flickerLightFieldTextures.some((texture) => texture))

  return [
    floorId,
    getChunkKeyForEntry(entry),
    entry.assetUrl,
    entry.transformKey,
    entry.variant,
    usesGpuFog ? `gpu-los:${entry.variant}` : entry.visibility,
    entry.receiveShadow ? 'shadow' : 'flat',
    entry.bakedLight || entry.bakedLightField
      ? `baked:${buildBakedLightFieldPipelineSignature(entry.bakedLightField)}`
      : 'unlit',
    entry.bakedLightDirectionSecondary ? 'double-direction' : 'single-direction',
    useBakedFlicker ? 'flicker' : 'steady',
  ].join('|')
}

export function getRenderBatchChunkKeyForCell(
  cell: readonly [number, number],
  chunkSize: number = DEFAULT_RENDER_BATCH_CHUNK_SIZE,
) {
  return getFloorChunkKeyForCell(cell, chunkSize)
}

export function getChunkKeyForStaticTileEntry(
  entry: Pick<StaticTileEntry, 'fogCell' | 'variantKey' | 'key' | 'position'>,
  chunkSize: number = DEFAULT_RENDER_BATCH_CHUNK_SIZE,
) {
  const cell = entry.fogCell
    ?? parseCellFromKey(entry.variantKey)
    ?? parseCellFromKey(entry.key)
    ?? [Math.round(entry.position[0]), Math.round(entry.position[2])] as const
  return getRenderBatchChunkKeyForCell(cell, chunkSize)
}

function getChunkKeyForEntry(
  entry: ResolvedStaticTileEntry,
  chunkSize: number = DEFAULT_RENDER_BATCH_CHUNK_SIZE,
) {
  return getChunkKeyForStaticTileEntry(entry, chunkSize)
}

function parseCellFromKey(key: string | undefined) {
  if (!key) {
    return null
  }

  const numericParts: number[] = []
  for (const part of key.split(':')) {
    const value = Number.parseInt(part, 10)
    if (Number.isNaN(value)) {
      continue
    }
    numericParts.push(value)
    if (numericParts.length === 2) {
      return [numericParts[0]!, numericParts[1]!] as const
    }
  }

  return null
}

function serializeOptionalVector(value: readonly number[] | undefined) {
  return value ? value.join(',') : ''
}

export function buildBakedLightFieldPipelineSignature(field: BakedFloorLightField | undefined | null) {
  if (!field) {
    return 'no-light-field'
  }

  if (!field.lightFieldTexture || !field.bounds) {
    return 'pending-light-field'
  }

  return [
    'layout',
    field.bounds.minCellX,
    field.bounds.maxCellX,
    field.bounds.minCellZ,
    field.bounds.maxCellZ,
    field.lightFieldTextureSize.width,
    field.lightFieldTextureSize.height,
    field.lightFieldGridSize.widthCells,
    field.lightFieldGridSize.heightCells,
    field.flickerLightFieldTextures.every((texture) => texture) ? 'flicker' : 'steady',
  ].join('|')
}

function buildGeometrySignature(entries: ResolvedStaticTileEntry[]) {
  return entries.map((entry) => [
    entry.key,
    entry.position.join(','),
    entry.rotation.join(','),
    entry.buildAnimationStart ?? '',
    entry.buildAnimationDelay ?? '',
    serializeOptionalVector(entry.bakedLightDirection),
    serializeOptionalVector(entry.bakedLightDirectionSecondary),
    entry.fogCell?.join(',') ?? '',
  ].join('|')).join(';')
}

function buildRenderSignature(
  entries: ResolvedStaticTileEntry[],
  usesGpuFog: boolean,
  useLineOfSightPostMask: boolean,
) {
  return entries.map((entry) => [
    entry.key,
    entry.visibility,
    usesGpuFog ? 'gpu-fog' : 'no-fog',
    buildBakedLightFieldPipelineSignature(entry.bakedLightField),
    useLineOfSightPostMask ? 'post-mask' : 'no-post-mask',
    entry.buildAnimationStart === undefined ? 'static' : 'animated',
  ].join('|')).join(';')
}

/**
 * Precomputes stream descriptors for static tile entries.
 * Group identity matches the new page stream key prefix (everything except page index).
 */
export function buildBatchDescriptors(
  entries: StaticTileEntry[],
  options: BuildBatchDescriptorOptions | boolean,
): BatchDescriptorBundle {
  const resolvedOptions = typeof options === 'boolean'
    ? {
      floorId: 'floor-1',
      fogOfWarEnabled: options,
      useLineOfSightPostMask: false,
      lightFlickerEnabled: false,
    }
    : options
  const resolved: ResolvedStaticTileEntry[] = []
  const fallback: StaticTileEntry[] = []

  entries.forEach((entry) => {
    const resolvedAsset = resolveBatchedTileAsset(entry.assetId, entry.variantKey, entry.objectProps)
    if (!resolvedAsset) {
      fallback.push(entry)
      return
    }

    const usesGpuFog = shouldUseBatchedGpuFog(entry.variant, resolvedOptions.fogOfWarEnabled)
    const shouldRenderBase = usesGpuFog || shouldRenderLineOfSightGeometry(entry.visibility, resolvedOptions.useLineOfSightPostMask)
    if (!shouldRenderBase && entry.visibility !== 'explored') {
      return
    }

    resolved.push({ ...entry, ...resolvedAsset })
  })

  const bucketMap = new Map<string, ResolvedStaticTileEntry[]>()
  resolved.forEach((entry) => {
    const usesGpuFog = shouldUseBatchedGpuFog(entry.variant, resolvedOptions.fogOfWarEnabled)
    const bucketKey = buildBucketKey(resolvedOptions.floorId, entry, usesGpuFog, resolvedOptions.lightFlickerEnabled)
    if (!bucketMap.has(bucketKey)) {
      bucketMap.set(bucketKey, [])
    }
    bucketMap.get(bucketKey)!.push(entry)
  })

  const batched: BatchDescriptor[] = []
  bucketMap.forEach((groupEntries, bucketKey) => {
    groupEntries.sort((left, right) => left.key.localeCompare(right.key))
    const firstEntry = groupEntries[0]!
    const usesGpuFog = shouldUseBatchedGpuFog(firstEntry.variant, resolvedOptions.fogOfWarEnabled)
    const chunkKey = getChunkKeyForEntry(firstEntry)
    const shouldRenderBase = usesGpuFog || shouldRenderLineOfSightGeometry(firstEntry.visibility, resolvedOptions.useLineOfSightPostMask)
    const useBakedLight = groupEntries.some((entry) => entry.bakedLight || entry.bakedLightField)
    const useBuildAnimation = groupEntries.some((entry) => entry.buildAnimationStart !== undefined)
    const useSecondaryDirectionAttribute = groupEntries.some((entry) => Boolean(entry.bakedLightDirectionSecondary))
    const useBakedFlicker =
      shouldRenderBase
      && resolvedOptions.lightFlickerEnabled
      && Boolean(firstEntry.bakedLightField?.flickerLightFieldTextures.some((texture) => texture))

    batched.push({
      floorId: resolvedOptions.floorId,
      bucketKey,
      chunkKey,
      entries: groupEntries,
      assetUrl: firstEntry.assetUrl,
      usesGpuFog,
      geometrySignature: buildGeometrySignature(groupEntries),
      renderSignature: buildRenderSignature(groupEntries, usesGpuFog, resolvedOptions.useLineOfSightPostMask),
      variant: firstEntry.variant,
      visibility: firstEntry.visibility,
      receiveShadow: firstEntry.receiveShadow,
      useBuildAnimation,
      useBakedLight,
      useBakedFlicker,
      useSecondaryDirectionAttribute,
      shouldRenderBase,
      useLineOfSightPostMask: resolvedOptions.useLineOfSightPostMask,
    })
  })

  return {
    batched,
    fallback,
  }
}
