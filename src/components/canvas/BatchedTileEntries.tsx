import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { PlayVisibilityState } from './playVisibility'
import { ContentPackInstance } from './ContentPackInstance'
import { shouldRenderLineOfSightGeometry } from './losRendering'
import { setLosLayers } from './losLayers'
import { buildMergedTileGeometryMeshes, type BatchedTilePlacement } from './batchedTileGeometry'
import { resolveBatchedTileAsset, type ResolvedBatchedTileAsset } from './tileAssetResolution'

export type StaticTileEntry = BatchedTilePlacement & {
  assetId: string | null
  variant: 'floor' | 'wall'
  variantKey?: string
  objectProps?: Record<string, unknown>
  visibility: PlayVisibilityState
}

type ResolvedStaticTileEntry = StaticTileEntry & ResolvedBatchedTileAsset

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
      const bucketKey = [
        entry.assetUrl,
        entry.transformKey,
        entry.visibility,
        entry.receiveShadow ? 'shadow' : 'flat',
      ].join('|')

      if (!grouped.has(bucketKey)) {
        grouped.set(bucketKey, [])
      }
      grouped.get(bucketKey)!.push(entry)
    })
    return Array.from(grouped.entries())
  }, [entries])

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

  const shouldRenderBase = shouldRenderLineOfSightGeometry(visibility, useLineOfSightPostMask)
  const overlayOpacity = visibility === 'hidden' ? 0.94 : visibility === 'explored' ? 0.6 : 0

  return (
    <>
      {shouldRenderBase && meshes.map((mesh) => (
        <MergedTileMesh
          key={`base:${mesh.key}`}
          geometry={mesh.geometry}
          material={mesh.material}
          receiveShadow={receiveShadow}
          visibility={visibility}
        />
      ))}
      {!useLineOfSightPostMask && visibility !== 'visible' && meshes.map((mesh) => (
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
}: {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  receiveShadow: boolean
  visibility: PlayVisibilityState
}) {
  const ref = useRef<THREE.Mesh>(null)

  // Create a shared depth material for shadows to avoid WebGPU pipeline issues
  const depthMaterial = useMemo(() => {
    const mat = new THREE.MeshDepthMaterial()
    mat.depthPacking = THREE.RGBADepthPacking
    return mat
  }, [])

  useLayoutEffect(() => {
    if (ref.current) {
      setLosLayers(ref.current, visibility)
      // Set custom shadow materials to avoid WebGPU crashes with cloned materials
      ref.current.customDepthMaterial = depthMaterial
    }
  }, [visibility, depthMaterial])

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
