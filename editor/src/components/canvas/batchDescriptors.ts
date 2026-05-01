import type { StaticTileEntry } from './BatchedTileEntries'
import { resolveBatchedTileAsset, type ResolvedBatchedTileAsset } from './tileAssetResolution'

export type ResolvedStaticTileEntry = StaticTileEntry & ResolvedBatchedTileAsset

export const DEFAULT_RENDER_BATCH_CHUNK_SIZE = 9

export type BatchDescriptor = {
  bucketKey: string
  chunkKey: string
  entries: ResolvedStaticTileEntry[]
  assetUrl: string
  usesGpuFog: boolean
  geometrySignature: string
  renderSignature: string
}

export type BatchDescriptorBundle = {
  batched: BatchDescriptor[]
  fallback: StaticTileEntry[]
}

function shouldUseBatchedGpuFog(
  variant: StaticTileEntry['variant'],
  fogOfWarEnabled: boolean,
) {
  return fogOfWarEnabled && variant === 'floor'
}

function buildBucketKey(
  entry: ResolvedStaticTileEntry,
  usesGpuFog: boolean,
): string {
  return [
    entry.assetUrl,
    entry.transformKey,
    usesGpuFog ? `gpu-los:${entry.variant}` : entry.visibility,
    entry.buildAnimationStart === undefined ? 'static-build' : 'animated-build',
    entry.receiveShadow ? 'shadow' : 'flat',
    entry.bakedLightDirectionSecondary ? 'double-direction' : 'single-direction',
  ].join('|')
}

export function getRenderBatchChunkKeyForCell(
  cell: readonly [number, number],
  chunkSize: number = DEFAULT_RENDER_BATCH_CHUNK_SIZE,
) {
  return `${Math.floor(cell[0] / chunkSize)}:${Math.floor(cell[1] / chunkSize)}`
}

function getChunkKeyForEntry(
  entry: ResolvedStaticTileEntry,
  chunkSize: number = DEFAULT_RENDER_BATCH_CHUNK_SIZE,
) {
  const cell = entry.fogCell
    ?? parseCellFromKey(entry.variantKey)
    ?? parseCellFromKey(entry.key)
    ?? [Math.round(entry.position[0]), Math.round(entry.position[2])] as const
  return getRenderBatchChunkKeyForCell(cell, chunkSize)
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
) {
  return entries.map((entry) => [
    entry.key,
    entry.visibility,
    usesGpuFog ? 'gpu-fog' : 'no-fog',
    entry.bakedLightField?.sourceHash ?? 'no-light-field',
  ].join('|')).join(';')
}

/**
 * Precomputes batch descriptors for static tile entries.
 * Moves asset resolution and compatibility grouping out of React render hot path.
 */
export function buildBatchDescriptors(
  entries: StaticTileEntry[],
  fogOfWarEnabled: boolean,
): BatchDescriptorBundle {
  const resolved: ResolvedStaticTileEntry[] = []
  const fallback: StaticTileEntry[] = []

  // Phase 1: Resolve assets
  entries.forEach((entry) => {
    const resolvedAsset = resolveBatchedTileAsset(entry.assetId, entry.variantKey, entry.objectProps)
    if (resolvedAsset) {
      resolved.push({ ...entry, ...resolvedAsset })
    } else {
      fallback.push(entry)
    }
  })

  // Phase 2: Group into buckets
  const bucketMap = new Map<string, ResolvedStaticTileEntry[]>()

  resolved.forEach((entry) => {
    const usesGpuFog = shouldUseBatchedGpuFog(entry.variant, fogOfWarEnabled)
    const chunkKey = getChunkKeyForEntry(entry)
    const bucketKey = `${chunkKey}|${buildBucketKey(entry, usesGpuFog)}`

    if (!bucketMap.has(bucketKey)) {
      bucketMap.set(bucketKey, [])
    }
    bucketMap.get(bucketKey)!.push(entry)
  })

  // Phase 3: Build descriptors
  const batched: BatchDescriptor[] = []
  bucketMap.forEach((entries, bucketKey) => {
    entries.sort((left, right) => left.key.localeCompare(right.key))
    const firstEntry = entries[0]!
    const usesGpuFog = shouldUseBatchedGpuFog(firstEntry.variant, fogOfWarEnabled)
    const [chunkKey] = bucketKey.split('|', 1)

    batched.push({
      bucketKey,
      chunkKey: chunkKey ?? '0:0',
      entries,
      assetUrl: firstEntry.assetUrl,
      usesGpuFog,
      geometrySignature: buildGeometrySignature(entries),
      renderSignature: buildRenderSignature(entries, usesGpuFog),
    })
  })
  
  return {
    batched,
    fallback,
  }
}
