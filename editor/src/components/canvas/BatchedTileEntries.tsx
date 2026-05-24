import { memo, Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ContentPackInstance } from './ContentPackInstance'
import { useGLTF } from '../../rendering/useGLTF'
import { useFogOfWarRuntime } from './fogOfWarHooks'
import { useDungeonStore } from '../../store/useDungeonStore'
import { buildChunkEntrySignature } from './BatchedTileEntriesShared'
import { useRegisteredLightSources } from './objectSourceRegistry'
import { getTileEntryYOffsetForAnimation, type TileEntryAnimationState } from './tileEntryAnimation'
import {
  buildBatchDescriptors,
  getChunkKeyForStaticTileEntry,
} from './batchDescriptors'
import { recordBuildPerfEvent } from '../../performance/runtimeBuildTrace'
import { useTileGpuStream } from './TileGpuStreamHooks'
import type { StaticTileEntry } from './tileEntries'
import type { RoomFloorMaskRuntime } from './roomFloorMaskRuntime'

export type { StaticTileEntry } from './tileEntries'

type BatchedTileEntriesProps = {
  entries: StaticTileEntry[]
  floorId: string
  mountId: string
  sourceId: string
  sourceKind?: 'static' | 'transaction'
  transactionId?: string
  useLineOfSightPostMask?: boolean
  useRoomFloorMask?: boolean
  roomFloorMaskRuntime?: RoomFloorMaskRuntime | null
  dynamicPointLightsActive?: boolean
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
  useRoomFloorMask = false,
  roomFloorMaskRuntime = null,
  dynamicPointLightsActive = false,
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
          useRoomFloorMask={useRoomFloorMask}
          roomFloorMaskRuntime={roomFloorMaskRuntime}
          dynamicPointLightsActive={dynamicPointLightsActive}
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
  useRoomFloorMask = false,
  roomFloorMaskRuntime = null,
  dynamicPointLightsActive = false,
}: BatchedTileEntriesChunkProps) {
  const fogOfWar = useFogOfWarRuntime()
  const lightFlickerEnabled = useDungeonStore((state) => state.lightFlickerEnabled)
  const registeredLightSources = useRegisteredLightSources(floorId)
  const hasLocalPointLights = dynamicPointLightsActive || registeredLightSources.length > 0
  const descriptors = useMemo(
    () => buildBatchDescriptors(entries, {
      floorId,
      fogOfWarEnabled: fogOfWar !== null,
      useLineOfSightPostMask,
      lightFlickerEnabled,
      roomFloorMaskRuntime: useRoomFloorMask ? roomFloorMaskRuntime : null,
      dynamicPointLightsActive: hasLocalPointLights,
    }),
    [entries, floorId, fogOfWar, hasLocalPointLights, lightFlickerEnabled, roomFloorMaskRuntime, useLineOfSightPostMask, useRoomFloorMask],
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
          useRoomFloorMask={useRoomFloorMask}
          roomFloorMaskRuntime={roomFloorMaskRuntime}
          dynamicPointLightsActive={hasLocalPointLights}
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
    && previous.useLineOfSightPostMask === next.useLineOfSightPostMask
    && previous.useRoomFloorMask === next.useRoomFloorMask
    && previous.roomFloorMaskRuntime?.signature === next.roomFloorMaskRuntime?.signature
    && previous.dynamicPointLightsActive === next.dynamicPointLightsActive,
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
  }, [floorId, mountId, resolvedGroups, sourceId, sourceKind, stream, transactionId])

  useLayoutEffect(() => () => {
    stream.clearSourceRegistration(mountId, sourceId)
  }, [mountId, sourceId, stream])

  const unresolvedEntries = useMemo(
    () => descriptors.batched.flatMap((descriptor) => {
      if (scenesByUrl.get(descriptor.assetUrl)) {
        return []
      }

      return descriptor.entries.map((entry) => ({
        entry,
        useLineOfSightPostMask: descriptor.useLineOfSightPostMask,
        useRoomFloorMask: descriptor.useRoomFloorMask,
        roomFloorMaskRuntime: descriptor.roomFloorMaskRuntime ?? null,
        dynamicPointLightsActive: descriptor.dynamicPointLightsActive,
      }))
    }),
    [descriptors.batched, scenesByUrl],
  )

  return (
    <>
      {sourceKind === 'static' && unresolvedEntries.map((fallbackEntry) => (
        <FallbackTileEntry
          key={fallbackEntry.entry.key}
          entry={fallbackEntry.entry}
          useLineOfSightPostMask={fallbackEntry.useLineOfSightPostMask}
          useRoomFloorMask={fallbackEntry.useRoomFloorMask}
          roomFloorMaskRuntime={fallbackEntry.roomFloorMaskRuntime}
          dynamicPointLightsActive={fallbackEntry.dynamicPointLightsActive}
        />
      ))}
    </>
  )
}

function FallbackTileEntry({
  entry,
  useLineOfSightPostMask,
  useRoomFloorMask,
  roomFloorMaskRuntime,
  dynamicPointLightsActive,
}: {
  entry: StaticTileEntry
  useLineOfSightPostMask: boolean
  useRoomFloorMask: boolean
  roomFloorMaskRuntime: RoomFloorMaskRuntime | null
  dynamicPointLightsActive: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const buildAnimation = useMemo<TileEntryAnimationState | null>(
    () => (entry.buildAnimationStart === undefined
      ? null
      : {
        startedAt: entry.buildAnimationStart,
        delay: entry.buildAnimationDelay ?? 0,
        direction: entry.buildAnimationDirection,
      }),
    [entry.buildAnimationDelay, entry.buildAnimationDirection, entry.buildAnimationStart],
  )

  useFrame(() => {
    const group = groupRef.current
    if (!group) {
      return
    }

    group.position.y = buildAnimation
      ? getTileEntryYOffsetForAnimation(buildAnimation, performance.now())
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
        propInstanceKey={entry.variant === 'prop' ? entry.key : undefined}
        visibility={entry.visibility}
        bakedLightField={entry.bakedLightField}
        bakedLight={entry.bakedLight}
        bakedLightDirection={entry.bakedLightDirection}
        bakedLightDirectionSecondary={entry.bakedLightDirectionSecondary}
        useLineOfSightPostMask={useLineOfSightPostMask}
        useRoomFloorMask={useRoomFloorMask && entry.variant === 'floor'}
        roomFloorMaskRuntime={entry.variant === 'floor' ? roomFloorMaskRuntime : null}
        dynamicPointLightsActive={dynamicPointLightsActive}
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
