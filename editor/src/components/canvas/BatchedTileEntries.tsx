import { Suspense, memo, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PlayVisibilityState } from './playVisibility'
import { ContentPackInstance } from './ContentPackInstance'
import { shouldRenderLineOfSightGeometry } from './losRendering'
import type { BatchedTilePlacement } from './batchedTileGeometry'
import { useGLTF } from '../../rendering/useGLTF'
import { applyFogOfWarToMaterial, useFogOfWarRuntime } from './fogOfWar'
import { applyBakedLightToMaterial } from './bakedLightMaterial'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getBuildYOffsetForAnimation, type BuildAnimationState } from '../../store/buildAnimations'
import { buildBatchDescriptors, type BatchDescriptor } from './batchDescriptors'
import {
  applyBelowGroundClipToMaterial,
  applyBuildAnimationToMaterial,
  getBelowGroundClipMinY,
} from './buildAnimationMaterial'
import { recordBuildPerfEvent, traceBuildPerf } from '../../performance/runtimeBuildTrace'
import {
  disposeInstancedMeshEntries,
  makeInstancedMeshEntries,
  updateInstancedMeshEntries,
  type InstancedMeshEntry,
} from './instancedTileMesh'

export type StaticTileEntry = BatchedTilePlacement & {
  assetId: string | null
  variant: 'floor' | 'wall'
  variantKey?: string
  objectProps?: Record<string, unknown>
  visibility: PlayVisibilityState
  bakedLightField?: BakedFloorLightField
  fogCell?: readonly [number, number]
}

export function BatchedTileEntries({
  entries,
  useLineOfSightPostMask = false,
}: {
  entries: StaticTileEntry[]
  useLineOfSightPostMask?: boolean
}) {
  const fogOfWar = useFogOfWarRuntime()
  const fogOfWarEnabled = fogOfWar !== null
  const descriptors = useMemo(
    () => buildBatchDescriptors(entries, fogOfWarEnabled),
    [entries, fogOfWarEnabled],
  )
  const tracedDescriptorStateRef = useRef<{
    bucketKeys: readonly string[]
    chunkKeys: readonly string[]
  } | null>(null)

  useLayoutEffect(() => {
    const nextBucketKeys = descriptors.batched.map((descriptor) => descriptor.bucketKey).sort()
    const nextChunkKeys = Array.from(
      new Set(descriptors.batched.map((descriptor) => descriptor.chunkKey)),
    ).sort()
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

    recordBuildPerfEvent('batched-chunk-diff', {
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
            useLineOfSightPostMask={useLineOfSightPostMask}
          />
        </Suspense>
      )}
      {descriptors.fallback.map((entry) => (
        <FallbackTileEntry
          key={entry.key}
          entry={entry}
          useLineOfSightPostMask={useLineOfSightPostMask}
        />
      ))}
    </>
  )
}

function ResolvedBatchedTileEntries({
  descriptors,
  useLineOfSightPostMask,
}: {
  descriptors: ReturnType<typeof buildBatchDescriptors>
  useLineOfSightPostMask: boolean
}) {
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

  return (
    <>
      {descriptors.batched.map((descriptor) => {
        const scene = scenesByUrl.get(descriptor.assetUrl)
        if (!scene) {
          return descriptor.entries.map((entry) => (
            <FallbackTileEntry
              key={entry.key}
              entry={entry}
              useLineOfSightPostMask={useLineOfSightPostMask}
            />
          ))
        }

        return (
          <MemoizedInstancedTileBucket
            key={descriptor.bucketKey}
            descriptor={descriptor}
            sourceScene={scene}
            useLineOfSightPostMask={useLineOfSightPostMask}
          />
        )
      })}
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

function InstancedTileBucket({
  descriptor,
  sourceScene,
  useLineOfSightPostMask,
}: {
  descriptor: BatchDescriptor
  sourceScene: THREE.Object3D
  useLineOfSightPostMask: boolean
}) {
  const { entries, usesGpuFog } = descriptor
  const visibility = entries[0]!.visibility
  const receiveShadow = entries[0]!.receiveShadow
  const useBuildAnimation = entries.some((entry) => entry.buildAnimationStart !== undefined)
  const useBakedLight = entries.some((entry) => entry.bakedLight || entry.bakedLightField)
  const bakedLightField = entries[0]!.bakedLightField ?? null
  const useSecondaryDirectionAttribute = entries.some((entry) => Boolean(entry.bakedLightDirectionSecondary))
  const depthMaterialsRef = useRef(new Map<string, THREE.MeshDepthMaterial>())
  const fogOfWar = useFogOfWarRuntime()
  const meshEntries = useMemo(
    () => traceBuildPerf('instanced-bucket-create', {
      bucketKey: descriptor.bucketKey,
      chunkKey: descriptor.chunkKey,
      entryCount: entries.length,
    }, () => makeInstancedMeshEntries(sourceScene, entries[0]!.transform)),
    // `bucketKey` includes the asset URL and transform key. Entry changes only
    // update per-instance buffers and should not recreate GPU mesh resources.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [descriptor.bucketKey, descriptor.chunkKey, sourceScene],
  )

  useLayoutEffect(
    () => {
      const depthMaterials = depthMaterialsRef.current
      return () => {
        disposeInstancedMeshEntries(meshEntries)
        depthMaterials.forEach((material) => material.dispose())
        depthMaterials.clear()
      }
    },
    [meshEntries],
  )

  useLayoutEffect(() => {
    updateInstancedMeshEntries(meshEntries, entries)
  }, [descriptor.geometrySignature, entries, meshEntries])

  useLayoutEffect(() => {
    recordBuildPerfEvent('instanced-bucket-update', {
      bucketKey: descriptor.bucketKey,
      chunkKey: descriptor.chunkKey,
      entryCount: entries.length,
      meshCount: meshEntries.length,
      animated: useBuildAnimation,
    })
  }, [descriptor.bucketKey, descriptor.chunkKey, entries.length, meshEntries.length, useBuildAnimation])

  const shouldRenderBase = usesGpuFog || shouldRenderLineOfSightGeometry(visibility, useLineOfSightPostMask)
  const overlayOpacity = visibility === 'explored' ? 0.6 : 0
  const lightFlickerEnabled = useDungeonStore((state) => state.lightFlickerEnabled)
  const useBakedFlicker = shouldRenderBase
    && lightFlickerEnabled
    && Boolean(bakedLightField?.flickerLightFieldTextures.some((texture) => texture))
  const clipMinY = getBelowGroundClipMinY(entries[0]!.variant)

  useLayoutEffect(() => {
    const activeMeshKeys = new Set(meshEntries.map((entry) => entry.meshKey))
    depthMaterialsRef.current.forEach((material, meshKey) => {
      if (activeMeshKeys.has(meshKey)) {
        return
      }

      material.dispose()
      depthMaterialsRef.current.delete(meshKey)
    })

    meshEntries.forEach((entry) => {
      const material = getInstancedMaterial(entry)
      applyBuildAnimationToMaterial(material, useBuildAnimation, clipMinY)
      applyBakedLightToMaterial(
        material,
        useBakedLight
          ? {
            useLightAttribute: true,
            useDirectionAttribute: entries[0]!.variant === 'wall',
            useSecondaryDirectionAttribute: entries[0]!.variant === 'wall' && useSecondaryDirectionAttribute,
            useTopSurfaceMask: entries[0]!.variant === 'floor',
            useFlicker: useBakedFlicker,
            lightField: bakedLightField,
          }
          : null,
      )
      applyFogOfWarToMaterial(
        material,
        usesGpuFog ? fogOfWar : null,
        {
          variant: entries[0]!.variant,
          useCellAttribute: usesGpuFog && entries[0]!.variant === 'floor',
        },
      )

      let depthMaterial = depthMaterialsRef.current.get(entry.meshKey)
      if (!depthMaterial) {
        depthMaterial = new THREE.MeshDepthMaterial()
        depthMaterial.depthPacking = THREE.RGBADepthPacking
        depthMaterialsRef.current.set(entry.meshKey, depthMaterial)
      }
      applyBelowGroundClipToMaterial(depthMaterial, useBuildAnimation, clipMinY)

      entry.instancedMesh.castShadow = !useBuildAnimation
      entry.instancedMesh.receiveShadow = receiveShadow
      entry.instancedMesh.customDepthMaterial = entry.instancedMesh.castShadow ? depthMaterial : undefined
      entry.tintMesh.visible = visibility === 'explored'
      setTintOpacity(entry.tintMesh, overlayOpacity)
    })
  }, [
    bakedLightField,
    clipMinY,
    entries,
    fogOfWar,
    meshEntries,
    overlayOpacity,
    receiveShadow,
    useBakedFlicker,
    useBakedLight,
    useBuildAnimation,
    useSecondaryDirectionAttribute,
    usesGpuFog,
    visibility,
  ])

  return (
    <>
      {shouldRenderBase && meshEntries.map((entry) => (
        <primitive
          key={`base:${entry.meshKey}`}
          object={entry.instancedMesh}
        />
      ))}
      {!usesGpuFog && visibility === 'explored' && meshEntries.map((entry) => (
        <primitive
          key={`overlay:${entry.meshKey}`}
          object={entry.tintMesh}
        />
      ))}
    </>
  )
}

const MemoizedInstancedTileBucket = memo(InstancedTileBucket, (previous, next) =>
  previous.sourceScene === next.sourceScene
  && previous.useLineOfSightPostMask === next.useLineOfSightPostMask
  && previous.descriptor.bucketKey === next.descriptor.bucketKey
  && previous.descriptor.geometrySignature === next.descriptor.geometrySignature
  && previous.descriptor.renderSignature === next.descriptor.renderSignature,
)

function getInstancedMaterial(entry: InstancedMeshEntry) {
  const material = entry.instancedMesh.material
  return Array.isArray(material) ? material[0]! : material
}

function setTintOpacity(mesh: THREE.InstancedMesh, opacity: number) {
  const material = mesh.material
  if (Array.isArray(material)) {
    material.forEach((entry) => {
      entry.opacity = opacity
    })
    return
  }

  material.opacity = opacity
}

function subtractStringSets(
  values: readonly string[],
  valuesToRemove: readonly string[],
) {
  const removals = new Set(valuesToRemove)
  return values.filter((value) => !removals.has(value))
}
