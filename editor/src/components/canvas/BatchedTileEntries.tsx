import { Suspense, memo, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PlayVisibilityState } from './playVisibility'
import { ContentPackInstance } from './ContentPackInstance'
import { shouldRenderLineOfSightGeometry } from './losRendering'
import { buildMergedTileGeometryMeshes, type BatchedTilePlacement } from './batchedTileGeometry'
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
          <MemoizedMergedTileBucket
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

function MergedTileBucket({
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
  const meshesRef = useRef<{
    geometrySignature: string
    sourceScene: THREE.Object3D
    meshes: ReturnType<typeof buildMergedTileGeometryMeshes>
  } | null>(null)
  const cachedMeshes = meshesRef.current
  const meshBuildMode =
    cachedMeshes === null
      ? 'create'
      : cachedMeshes.geometrySignature !== descriptor.geometrySignature || cachedMeshes.sourceScene !== sourceScene
        ? 'rebuild'
        : 'reuse'
  const meshes = meshBuildMode === 'reuse' && cachedMeshes
    ? cachedMeshes.meshes
    : traceBuildPerf('merged-geometry-build', {
      bucketKey: descriptor.bucketKey,
      chunkKey: descriptor.chunkKey,
      entryCount: entries.length,
      buildMode: meshBuildMode,
    }, () => buildMergedTileGeometryMeshes({
      sourceScene,
      placements: entries,
      transform: entries[0]!.transform,
    }))

  useLayoutEffect(
    () => {
      const previous = meshesRef.current
      if (previous && previous.meshes !== meshes) {
        previous.meshes.forEach((mesh) => {
          mesh.geometry.dispose()
          mesh.material.dispose()
        })
      }

      meshesRef.current = {
        geometrySignature: descriptor.geometrySignature,
        sourceScene,
        meshes,
      }

      return () => {
        if (meshesRef.current?.meshes !== meshes) {
          return
        }

        meshes.forEach((mesh) => {
          mesh.geometry.dispose()
          mesh.material.dispose()
        })
        meshesRef.current = null
      }
    },
    [descriptor.geometrySignature, meshes, sourceScene],
  )

  useLayoutEffect(() => {
    recordBuildPerfEvent('merged-bucket-mount', {
      bucketKey: descriptor.bucketKey,
      chunkKey: descriptor.chunkKey,
      entryCount: entries.length,
      meshCount: meshes.length,
      buildMode: meshBuildMode,
      animated: useBuildAnimation,
    })
  }, [descriptor.bucketKey, descriptor.chunkKey, entries.length, meshBuildMode, meshes.length, useBuildAnimation])

  const shouldRenderBase = usesGpuFog || shouldRenderLineOfSightGeometry(visibility, useLineOfSightPostMask)
  const overlayOpacity = visibility === 'explored' ? 0.6 : 0
  const lightFlickerEnabled = useDungeonStore((state) => state.lightFlickerEnabled)
  const useBakedFlicker = shouldRenderBase
    && lightFlickerEnabled
    && Boolean(bakedLightField?.flickerLightFieldTextures.some((texture) => texture))

  return (
    <>
      {shouldRenderBase && meshes.map((mesh) => (
        <MergedTileMesh
          key={`base:${mesh.key}`}
          geometry={mesh.geometry}
          material={mesh.material}
          castShadow={!useBuildAnimation}
          receiveShadow={receiveShadow}
          visibility={visibility}
          variant={entries[0]!.variant}
          bakedLightField={bakedLightField}
          useBakedLight={useBakedLight}
          useBakedFlicker={useBakedFlicker}
          useSecondaryDirectionAttribute={useSecondaryDirectionAttribute}
          useGpuFog={usesGpuFog}
          />
        ))}
      {!usesGpuFog && visibility === 'explored' && meshes.map((mesh) => (
        <MergedTintMesh
          key={`overlay:${mesh.key}`}
          geometry={mesh.geometry}
          opacity={overlayOpacity}
        />
      ))}
    </>
  )
}

const MemoizedMergedTileBucket = memo(MergedTileBucket, (previous, next) =>
  previous.sourceScene === next.sourceScene
  && previous.useLineOfSightPostMask === next.useLineOfSightPostMask
  && previous.descriptor.bucketKey === next.descriptor.bucketKey
  && previous.descriptor.geometrySignature === next.descriptor.geometrySignature
  && previous.descriptor.renderSignature === next.descriptor.renderSignature,
)

function MergedTileMesh({
  geometry,
  material,
  castShadow,
  receiveShadow,
  visibility,
  variant,
  bakedLightField,
  useBakedLight,
  useBakedFlicker,
  useSecondaryDirectionAttribute,
  useGpuFog,
}: {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  castShadow: boolean
  receiveShadow: boolean
  visibility: PlayVisibilityState
  variant: 'floor' | 'wall'
  bakedLightField: BakedFloorLightField | null
  useBakedLight: boolean
  useBakedFlicker: boolean
  useSecondaryDirectionAttribute: boolean
  useGpuFog: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)
  const fogOfWar = useFogOfWarRuntime()
  const clipMinY = getBelowGroundClipMinY(variant)

  // Create a shared depth material for shadows to avoid WebGPU pipeline issues
  const depthMaterial = useMemo(() => {
    const mat = new THREE.MeshDepthMaterial()
    mat.depthPacking = THREE.RGBADepthPacking
    return mat
  }, [])

  useLayoutEffect(() => {
    const hasBuildAnimation = geometry.getAttribute('buildAnimationStart') !== undefined
    if (ref.current) {
      // Set custom shadow materials to avoid WebGPU crashes with cloned materials.
      ref.current.customDepthMaterial = castShadow ? depthMaterial : undefined
    }
    applyBelowGroundClipToMaterial(depthMaterial, hasBuildAnimation, clipMinY)
  }, [castShadow, clipMinY, depthMaterial, geometry, visibility])

  useLayoutEffect(() => {
    const hasBuildAnimation = geometry.getAttribute('buildAnimationStart') !== undefined
    applyBuildAnimationToMaterial(material, hasBuildAnimation, clipMinY)
    applyBakedLightToMaterial(
      material,
      useBakedLight
        ? {
          useLightAttribute: true,
          useDirectionAttribute: variant === 'wall',
          useSecondaryDirectionAttribute: variant === 'wall' && useSecondaryDirectionAttribute,
          useTopSurfaceMask: variant === 'floor',
          useFlicker: useBakedFlicker,
          lightField: bakedLightField,
        }
        : null,
    )
    applyFogOfWarToMaterial(
      material,
      useGpuFog ? fogOfWar : null,
      {
        variant,
        useCellAttribute: useGpuFog && variant === 'floor',
      },
    )
  }, [bakedLightField, clipMinY, fogOfWar, geometry, material, useBakedFlicker, useBakedLight, useGpuFog, useSecondaryDirectionAttribute, variant])

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      material={material}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  )
}

function MergedTintMesh({
  geometry,
  opacity,
}: {
  geometry: THREE.BufferGeometry
  opacity: number
}) {
  const ref = useRef<THREE.Mesh>(null)

  useLayoutEffect(() => {
    if (!ref.current) {
      return
    }

    ref.current.userData.ignoreLosRaycast = true
    ref.current.raycast = () => {}
  }, [])

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      renderOrder={1}
    >
      <meshBasicMaterial
        color="#050609"
        transparent
        opacity={opacity}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  )
}

function subtractStringSets(
  values: readonly string[],
  valuesToRemove: readonly string[],
) {
  const removals = new Set(valuesToRemove)
  return values.filter((value) => !removals.has(value))
}
