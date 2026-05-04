import { memo, Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ContentPackInstance } from './ContentPackInstance'
import { useGLTF } from '../../rendering/useGLTF'
import { useFogOfWarRuntime } from './fogOfWar'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getBuildYOffsetForAnimation, type BuildAnimationState } from '../../store/buildAnimations'
import { buildBatchDescriptors, getChunkKeyForStaticTileEntry } from './batchDescriptors'
import { recordBuildPerfEvent } from '../../performance/runtimeBuildTrace'
import { useTileGpuStream } from './TileGpuStreamContext'
import type { StaticTileEntry } from './tileEntries'

export type { StaticTileEntry } from './tileEntries'

type BatchedTileEntriesProps = {
  entries: StaticTileEntry[]
  floorId: string
  mountId: string
  sourceId: string
  sourceKind?: 'static' | 'transaction'
  transactionId?: string
  useLineOfSightPostMask?: boolean
}

type BatchedTileEntryChunk = {
  chunkKey: string
  entries: StaticTileEntry[]
  signature: string
}

type BatchedTileEntriesChunkProps = BatchedTileEntriesProps & {
  entriesSignature: string
}

export function BatchedTileEntries({
  entries,
  floorId,
  mountId,
  sourceId,
  sourceKind = 'static',
  transactionId,
  useLineOfSightPostMask = false,
}: BatchedTileEntriesProps) {
  const entryChunks = useMemo(
    () => partitionTileEntriesByChunk(entries),
    [entries],
  )

  return (
    <>
      {entryChunks.map((chunk) => (
        <MemoizedBatchedTileEntriesChunk
          key={`${sourceId}:${chunk.chunkKey}`}
          entries={chunk.entries}
          entriesSignature={chunk.signature}
          floorId={floorId}
          mountId={mountId}
          sourceId={`${sourceId}:${chunk.chunkKey}`}
          sourceKind={sourceKind}
          transactionId={transactionId}
          useLineOfSightPostMask={useLineOfSightPostMask}
        />
      ))}
    </>
  )
}

function BatchedTileEntriesChunk({
  entries,
  floorId,
  mountId,
  sourceId,
  sourceKind = 'static',
  transactionId,
  useLineOfSightPostMask = false,
}: BatchedTileEntriesChunkProps) {
  const fogOfWar = useFogOfWarRuntime()
  const lightFlickerEnabled = useDungeonStore((state) => state.lightFlickerEnabled)
  const descriptors = useMemo(
    () => buildBatchDescriptors(entries, {
      floorId,
      fogOfWarEnabled: fogOfWar !== null,
      useLineOfSightPostMask,
      lightFlickerEnabled,
    }),
    [entries, floorId, fogOfWar, lightFlickerEnabled, useLineOfSightPostMask],
  )
  const tracedDescriptorStateRef = useRef<{
    bucketKeys: readonly string[]
    chunkKeys: readonly string[]
  } | null>(null)

  useLayoutEffect(() => {
    const nextBucketKeys = descriptors.batched.map((descriptor) => descriptor.bucketKey).sort()
    const nextChunkKeys = Array.from(new Set(descriptors.batched.map((descriptor) => descriptor.chunkKey))).sort()
    const previous = tracedDescriptorStateRef.current

    tracedDescriptorStateRef.current = {
      bucketKeys: nextBucketKeys,
      chunkKeys: nextChunkKeys,
    }

    if (!previous) {
      return
    }

    const addedChunkKeys = subtractStringSets(nextChunkKeys, previous.chunkKeys)
    const removedChunkKeys = subtractStringSets(previous.chunkKeys, nextChunkKeys)
    const addedBucketCount = subtractStringSets(nextBucketKeys, previous.bucketKeys).length
    const removedBucketCount = subtractStringSets(previous.bucketKeys, nextBucketKeys).length

    if (addedBucketCount === 0 && removedBucketCount === 0) {
      return
    }

    recordBuildPerfEvent('tile-stream-chunk-diff', {
      batchedCount: descriptors.batched.length,
      fallbackCount: descriptors.fallback.length,
      chunkCount: nextChunkKeys.length,
      addedChunkKeys,
      removedChunkKeys,
      addedBucketCount,
      removedBucketCount,
    })
  }, [descriptors])

  return (
    <>
      {descriptors.batched.length > 0 && (
        <Suspense fallback={null}>
          <ResolvedBatchedTileEntries
            descriptors={descriptors}
            floorId={floorId}
            mountId={mountId}
            sourceId={sourceId}
            sourceKind={sourceKind}
            transactionId={transactionId}
            fogRuntime={fogOfWar}
          />
        </Suspense>
      )}
      {sourceKind === 'static' && descriptors.fallback.map((entry) => (
        <FallbackTileEntry
          key={entry.key}
          entry={entry}
          useLineOfSightPostMask={useLineOfSightPostMask}
        />
      ))}
    </>
  )
}

const MemoizedBatchedTileEntriesChunk = memo(
  BatchedTileEntriesChunk,
  (previous, next) =>
    previous.entriesSignature === next.entriesSignature
    && previous.floorId === next.floorId
    && previous.mountId === next.mountId
    && previous.sourceId === next.sourceId
    && previous.sourceKind === next.sourceKind
    && previous.transactionId === next.transactionId
    && previous.useLineOfSightPostMask === next.useLineOfSightPostMask,
)

function ResolvedBatchedTileEntries({
  descriptors,
  floorId,
  mountId,
  sourceId,
  sourceKind = 'static',
  transactionId,
  fogRuntime,
}: {
  descriptors: ReturnType<typeof buildBatchDescriptors>
  floorId: string
  mountId: string
  sourceId: string
  sourceKind?: 'static' | 'transaction'
  transactionId?: string
  fogRuntime: ReturnType<typeof useFogOfWarRuntime>
}) {
  const stream = useTileGpuStream()
  const assetUrls = useMemo(
    () => Array.from(new Set(descriptors.batched.map((desc) => desc.assetUrl))),
    [descriptors.batched],
  )
  const gltfs = useGLTF(assetUrls as string[])
  const scenesByUrl = useMemo(() => {
    const loaded = Array.isArray(gltfs) ? gltfs : [gltfs]
    return new Map(
      assetUrls.map((assetUrl, index) => [assetUrl, loaded[index]?.scene ?? null]),
    )
  }, [assetUrls, gltfs])

  const resolvedGroups = useMemo(
    () => descriptors.batched.flatMap((descriptor) => {
      const sourceScene = scenesByUrl.get(descriptor.assetUrl)
      if (!sourceScene) {
        return []
      }

      return [{
        ...descriptor,
        floorId,
        sourceScene,
        fogRuntime,
      }]
    }),
    [descriptors.batched, floorId, fogRuntime, scenesByUrl],
  )

  useLayoutEffect(() => {
    stream.setSourceRegistration(mountId, sourceId, {
      kind: sourceKind,
      floorId,
      transactionId,
      groups: resolvedGroups,
    })

    return () => {
      stream.clearSourceRegistration(mountId, sourceId)
    }
  }, [floorId, mountId, resolvedGroups, sourceId, sourceKind, stream, transactionId])

  const unresolvedEntries = useMemo(
    () => descriptors.batched.flatMap((descriptor) => {
      if (scenesByUrl.get(descriptor.assetUrl)) {
        return []
      }

      return descriptor.entries
    }),
    [descriptors.batched, scenesByUrl],
  )

  return (
    <>
      {sourceKind === 'static' && unresolvedEntries.map((entry) => (
        <FallbackTileEntry
          key={entry.key}
          entry={entry}
          useLineOfSightPostMask={descriptorUsesPostMask(descriptors)}
        />
      ))}
    </>
  )
}

function FallbackTileEntry({
  entry,
  useLineOfSightPostMask,
}: {
  entry: StaticTileEntry
  useLineOfSightPostMask: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const buildAnimation = useMemo<BuildAnimationState | null>(
    () => (entry.buildAnimationStart === undefined
      ? null
      : {
        startedAt: entry.buildAnimationStart,
        delay: entry.buildAnimationDelay ?? 0,
      }),
    [entry.buildAnimationDelay, entry.buildAnimationStart],
  )

  useFrame(() => {
    const group = groupRef.current
    if (!group) {
      return
    }

    group.position.y = buildAnimation
      ? getBuildYOffsetForAnimation(buildAnimation, performance.now())
      : 0
  })

  useLayoutEffect(() => () => {
    if (groupRef.current) {
      groupRef.current.position.y = 0
    }
  }, [])

  return (
    <group ref={groupRef}>
      <ContentPackInstance
        assetId={entry.assetId}
        position={entry.position}
        rotation={entry.rotation}
        variant={entry.variant}
        variantKey={entry.variantKey}
        visibility={entry.visibility}
        useLineOfSightPostMask={useLineOfSightPostMask}
        clipBelowGround={buildAnimation !== null}
        objectProps={entry.objectProps}
        castShadow={buildAnimation ? false : undefined}
      />
    </group>
  )
}

function subtractStringSets(
  values: readonly string[],
  valuesToRemove: readonly string[],
) {
  const removals = new Set(valuesToRemove)
  return values.filter((value) => !removals.has(value))
}

function descriptorUsesPostMask(descriptors: ReturnType<typeof buildBatchDescriptors>) {
  return descriptors.batched[0]?.useLineOfSightPostMask ?? false
}

function partitionTileEntriesByChunk(entries: readonly StaticTileEntry[]): BatchedTileEntryChunk[] {
  const groupedEntries = new Map<string, StaticTileEntry[]>()
  entries.forEach((entry) => {
    const chunkKey = getChunkKeyForStaticTileEntry(entry)
    const chunkEntries = groupedEntries.get(chunkKey)
    if (chunkEntries) {
      chunkEntries.push(entry)
      return
    }

    groupedEntries.set(chunkKey, [entry])
  })

  return [...groupedEntries.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([chunkKey, chunkEntries]) => {
      const sortedEntries = [...chunkEntries].sort((left, right) => left.key.localeCompare(right.key))
      return {
        chunkKey,
        entries: sortedEntries,
        signature: buildChunkEntrySignature(sortedEntries),
      }
    })
}

export function buildChunkEntrySignature(entries: readonly StaticTileEntry[]) {
  return entries.map((entry) => [
    entry.key,
    entry.assetId,
    entry.position.join(','),
    entry.rotation.join(','),
    entry.variant,
    entry.variantKey ?? '',
    entry.visibility,
    entry.buildAnimationStart ?? '',
    entry.buildAnimationDelay ?? '',
    entry.fogCell?.join(',') ?? '',
    entry.bakedLightField?.sourceHash ?? 'no-light-field',
    entry.bakedLightField?.lightFieldTexture?.uuid ?? 'pending-light-field',
    entry.bakedLightField?.flickerLightFieldTextures.map((texture) => texture?.uuid ?? 'no-flicker').join(',') ?? '',
    entry.bakedLightDirection?.join(',') ?? '',
    entry.bakedLightDirectionSecondary?.join(',') ?? '',
    JSON.stringify(entry.objectProps ?? null),
  ].join('|')).join(';')
}
