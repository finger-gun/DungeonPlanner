import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { PlayVisibilityState } from './playVisibility'
import { ContentPackInstance } from './ContentPackInstance'
import { shouldRenderLineOfSightGeometry } from './losRendering'
import { buildMergedTileGeometryMeshes, type BatchedTilePlacement } from './batchedTileGeometry'
import { resolveBatchedTileAsset, type ResolvedBatchedTileAsset } from './tileAssetResolution'
import { useGLTF } from '../../rendering/useGLTF'
import { applyFogOfWarToMaterial, useFogOfWarRuntime } from './fogOfWar'
import { applyBakedLightToMaterial } from './bakedLightMaterial'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'

export type StaticTileEntry = BatchedTilePlacement & {
  assetId: string | null
  variant: 'floor' | 'wall'
  variantKey?: string
  objectProps?: Record<string, unknown>
  visibility: PlayVisibilityState
  bakedLightField?: BakedFloorLightField
  fogCell?: readonly [number, number]
}

type ResolvedStaticTileEntry = StaticTileEntry & ResolvedBatchedTileAsset

function shouldUseBatchedGpuFog(
  variant: StaticTileEntry['variant'],
  fogOfWar: ReturnType<typeof useFogOfWarRuntime>,
) {
  return fogOfWar !== null && variant === 'floor'
}

export function BatchedTileEntries({
  entries,
  useLineOfSightPostMask = false,
}: {
  entries: StaticTileEntry[]
  useLineOfSightPostMask?: boolean
}) {
  const { batchableEntries, fallbackEntries } = useMemo(() => {
    const batchable: ResolvedStaticTileEntry[] = []
    const fallback: StaticTileEntry[] = []

    entries.forEach((entry) => {
      const resolved = resolveBatchedTileAsset(entry.assetId, entry.variantKey, entry.objectProps)
      if (resolved) {
        batchable.push({ ...entry, ...resolved })
      } else {
        fallback.push(entry)
      }
    })

    return {
      batchableEntries: batchable,
      fallbackEntries: fallback,
    }
  }, [entries])

  return (
    <>
      {batchableEntries.length > 0 && (
        <Suspense fallback={null}>
          <ResolvedBatchedTileEntries
            entries={batchableEntries}
            useLineOfSightPostMask={useLineOfSightPostMask}
          />
        </Suspense>
      )}
      {fallbackEntries.map((entry) => (
        <ContentPackInstance
          key={entry.key}
          assetId={entry.assetId}
          position={entry.position}
          rotation={entry.rotation}
          variant={entry.variant}
          variantKey={entry.variantKey}
          visibility={entry.visibility}
          useLineOfSightPostMask={useLineOfSightPostMask}
          objectProps={entry.objectProps}
        />
      ))}
    </>
  )
}

function ResolvedBatchedTileEntries({
  entries,
  useLineOfSightPostMask,
}: {
  entries: ResolvedStaticTileEntry[]
  useLineOfSightPostMask: boolean
}) {
  const fogOfWar = useFogOfWarRuntime()
  const assetUrls = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.assetUrl))),
    [entries],
  )
  const gltfs = useGLTF(assetUrls as string[])
  const scenesByUrl = useMemo(() => {
    const loaded = Array.isArray(gltfs) ? gltfs : [gltfs]
    return new Map(
      assetUrls.map((assetUrl, index) => [assetUrl, loaded[index]?.scene ?? null]),
    )
  }, [assetUrls, gltfs])

  const buckets = useMemo(() => {
    const grouped = new Map<string, ResolvedStaticTileEntry[]>()
    entries.forEach((entry) => {
      const usesGpuFog = shouldUseBatchedGpuFog(entry.variant, fogOfWar)
      const bucketKey = [
        entry.assetUrl,
        entry.transformKey,
        usesGpuFog ? `gpu-los:${entry.variant}` : entry.visibility,
        entry.receiveShadow ? 'shadow' : 'flat',
      ].join('|')

      if (!grouped.has(bucketKey)) {
        grouped.set(bucketKey, [])
      }
      grouped.get(bucketKey)!.push(entry)
    })
    return Array.from(grouped.entries())
  }, [entries, fogOfWar])

  return (
    <>
      {buckets.map(([bucketKey, bucketEntries]) => {
        const scene = scenesByUrl.get(bucketEntries[0]!.assetUrl)
        if (!scene) {
          return bucketEntries.map((entry) => (
            <ContentPackInstance
              key={entry.key}
              assetId={entry.assetId}
              position={entry.position}
              rotation={entry.rotation}
              variant={entry.variant}
              variantKey={entry.variantKey}
              visibility={entry.visibility}
              useLineOfSightPostMask={useLineOfSightPostMask}
              objectProps={entry.objectProps}
            />
          ))
        }

        return (
          <MergedTileBucket
            key={bucketKey}
            sourceScene={scene}
            entries={bucketEntries}
            useLineOfSightPostMask={useLineOfSightPostMask}
          />
        )
      })}
    </>
  )
}

function MergedTileBucket({
  sourceScene,
  entries,
  useLineOfSightPostMask,
}: {
  sourceScene: THREE.Object3D
  entries: ResolvedStaticTileEntry[]
  useLineOfSightPostMask: boolean
}) {
  const fogOfWar = useFogOfWarRuntime()
  const usesGpuFog = shouldUseBatchedGpuFog(entries[0]!.variant, fogOfWar)
  const visibility = entries[0]!.visibility
  const receiveShadow = entries[0]!.receiveShadow
  const meshes = useMemo(
    () => buildMergedTileGeometryMeshes({
      sourceScene,
      placements: entries,
      transform: entries[0]!.transform,
    }),
    [entries, sourceScene],
  )

  useLayoutEffect(
    () => () => {
      meshes.forEach((mesh) => {
        mesh.geometry.dispose()
        mesh.material.dispose()
      })
    },
    [meshes],
  )

  const shouldRenderBase = usesGpuFog || shouldRenderLineOfSightGeometry(visibility, useLineOfSightPostMask)
  const overlayOpacity = visibility === 'explored' ? 0.6 : 0
  const useBakedLight = entries.some((entry) => entry.bakedLight || entry.bakedLightField)
  const bakedLightField = entries[0]!.bakedLightField ?? null
  const useSecondaryDirectionAttribute = entries.some((entry) => Boolean(entry.bakedLightDirectionSecondary))

  return (
    <>
      {shouldRenderBase && meshes.map((mesh) => (
        <MergedTileMesh
          key={`base:${mesh.key}`}
          geometry={mesh.geometry}
          material={mesh.material}
          receiveShadow={receiveShadow}
          visibility={visibility}
          variant={entries[0]!.variant}
          bakedLightField={bakedLightField}
          useBakedLight={useBakedLight}
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

function MergedTileMesh({
  geometry,
  material,
  receiveShadow,
  visibility,
  variant,
  bakedLightField,
  useBakedLight,
  useSecondaryDirectionAttribute,
  useGpuFog,
}: {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  receiveShadow: boolean
  visibility: PlayVisibilityState
  variant: 'floor' | 'wall'
  bakedLightField: BakedFloorLightField | null
  useBakedLight: boolean
  useSecondaryDirectionAttribute: boolean
  useGpuFog: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)
  const fogOfWar = useFogOfWarRuntime()

  // Create a shared depth material for shadows to avoid WebGPU pipeline issues
  const depthMaterial = useMemo(() => {
    const mat = new THREE.MeshDepthMaterial()
    mat.depthPacking = THREE.RGBADepthPacking
    return mat
  }, [])

  useLayoutEffect(() => {
    if (ref.current) {
      // Set custom shadow materials to avoid WebGPU crashes with cloned materials
      ref.current.customDepthMaterial = depthMaterial
    }
  }, [visibility, depthMaterial])

  useLayoutEffect(() => {
    applyBakedLightToMaterial(
      material,
      useBakedLight
        ? {
          useLightAttribute: true,
          useDirectionAttribute: variant === 'wall',
          useSecondaryDirectionAttribute: variant === 'wall' && useSecondaryDirectionAttribute,
          useTopSurfaceMask: variant === 'floor',
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
  }, [bakedLightField, fogOfWar, material, useBakedLight, useGpuFog, useSecondaryDirectionAttribute, variant])

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      material={material}
      castShadow={true}
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
