import { Suspense, useEffect, useLayoutEffect, useRef, useMemo, useState } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { getContentPackAssetById } from '../../content-packs/registry'
import type { ComponentType } from 'react'
import type { ContentPackComponentProps } from '../../content-packs/types'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'
import type { PlayVisibilityState } from './playVisibility'
import { shouldRenderLineOfSightGeometry } from './losRendering'
import {
  cloneSceneWithNodeMaterials,
  createStandardCompatibleMaterial,
} from '../../rendering/nodeMaterialUtils'
import { useGLTF } from '../../rendering/useGLTF'
import { applyFogOfWarToMaterial, applyFogOfWarToObject, useFogOfWarRuntime } from './fogOfWar'

function shouldUseGpuFog(variant: ContentPackInstanceVariant, fogOfWar: ReturnType<typeof useFogOfWarRuntime>) {
  return fogOfWar !== null && variant === 'floor'
}

type ContentPackInstanceVariant = 'floor' | 'wall' | 'prop'

/** Semi-transparent colour overlay — clones the geometry with a translucent material. */
function TintOverlay({
  source,
  color,
  opacity = 0.42,
  refreshKey,
}: {
  source: THREE.Object3D
  color: string
  opacity?: number
  refreshKey?: string
}) {
  const overlay = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.FrontSide,
    })
    const clone = SkeletonUtils.clone(source)
    clone.name = refreshKey ? `tint-overlay:${refreshKey}` : 'tint-overlay'
    clone.visible = true
    clone.traverse((obj) => {
      obj.visible = true
      if (obj instanceof THREE.Mesh) {
        obj.material = mat
        obj.renderOrder = 1
        obj.castShadow = false
        obj.receiveShadow = false
      }
    })
    markIgnoreLosRaycast(clone)
    disableRaycast(clone)
    return clone
  }, [source, color, opacity, refreshKey])

  return <primitive object={overlay} />
}

type ContentPackInstanceProps = ThreeElements['group'] & {
  assetId: string | null
  selected?: boolean
  poseSelected?: boolean
  playerAnimationState?: 'default' | 'selected' | 'pickup' | 'holding' | 'release'
  tint?: string
  tintOpacity?: number
  overlayOnly?: boolean
  visibility?: PlayVisibilityState
  useLineOfSightPostMask?: boolean
  variant: ContentPackInstanceVariant
  variantKey?: string
  objectProps?: Record<string, unknown>
}

export function ContentPackInstance({
  assetId,
  selected = false,
  poseSelected = false,
  playerAnimationState = poseSelected ? 'selected' : 'default',
  tint,
  tintOpacity,
  overlayOnly = false,
  visibility = 'visible',
  useLineOfSightPostMask = false,
  variant,
  variantKey,
  objectProps,
  ...groupProps
}: ContentPackInstanceProps) {
  const asset = assetId ? getContentPackAssetById(assetId) : null
  const assetPath = asset?.assetUrl
  const AssetComponent = asset?.Component ?? null
  const castShadow = asset?.metadata?.castShadow !== false
  const receiveShadow = asset?.metadata?.receiveShadow !== false

  useEffect(() => {
    if (assetPath && !AssetComponent) {
      useGLTF.preload(assetPath)
    }
  }, [AssetComponent, assetPath])

  if (!assetPath && !AssetComponent) {
    return (
      <group {...groupProps}>
        <FallbackMesh
          selected={selected}
          variant={variant}
          variantKey={variantKey}
          receiveShadow={receiveShadow}
          tint={tint}
          tintOpacity={tintOpacity}
          overlayOnly={overlayOnly}
          visibility={visibility}
          useLineOfSightPostMask={useLineOfSightPostMask}
        />
      </group>
    )
  }

  return (
    <Suspense
      fallback={
        <group {...groupProps}>
          <FallbackMesh
            selected={selected}
            variant={variant}
            variantKey={variantKey}
            receiveShadow={receiveShadow}
            tint={tint}
            tintOpacity={tintOpacity}
            overlayOnly={overlayOnly}
            visibility={visibility}
            useLineOfSightPostMask={useLineOfSightPostMask}
          />
        </group>
      }
    >
      {AssetComponent ? (
        <ComponentAsset
          Component={AssetComponent}
          componentProps={getComponentProps(
            variantKey,
            objectProps,
            poseSelected,
            playerAnimationState,
          )}
          receiveShadow={receiveShadow}
          castShadow={castShadow}
          selected={selected}
          tint={tint}
          tintOpacity={tintOpacity}
          overlayOnly={overlayOnly}
          visibility={visibility}
          useLineOfSightPostMask={useLineOfSightPostMask}
          variant={variant}
          {...groupProps}
        />
      ) : (
        <GLTFModel
          assetPath={assetPath!}
          receiveShadow={receiveShadow}
          castShadow={castShadow}
          selected={selected}
          tint={tint}
          tintOpacity={tintOpacity}
          overlayOnly={overlayOnly}
          visibility={visibility}
          useLineOfSightPostMask={useLineOfSightPostMask}
          variantKey={variantKey}
          variant={variant}
          {...groupProps}
        />
      )}
    </Suspense>
  )
}

function getComponentProps(
  variantKey?: string,
  objectProps?: Record<string, unknown>,
  poseSelected?: boolean,
  playerAnimationState?: 'default' | 'selected' | 'pickup' | 'holding' | 'release',
): ContentPackComponentProps {
  return {
    ...(variantKey ? { variantKey } : {}),
    ...(objectProps ? { objectProps } : {}),
    ...(poseSelected ? { poseSelected } : {}),
    ...(playerAnimationState ? { playerAnimationState } : {}),
  }
}

function GLTFModel({
  assetPath,
  receiveShadow,
  castShadow,
  selected,
  tint,
  tintOpacity,
  overlayOnly,
  visibility,
  useLineOfSightPostMask = false,
  variantKey,
  variant,
  ...groupProps
}: ThreeElements['group'] & {
  assetPath: string
  receiveShadow: boolean
  castShadow: boolean
  selected?: boolean
  tint?: string
  tintOpacity?: number
  overlayOnly?: boolean
  visibility?: PlayVisibilityState
  useLineOfSightPostMask?: boolean
  variantKey?: string
  variant: ContentPackInstanceVariant
}) {
  const gltf = useGLTF(assetPath)
  const fogOfWar = useFogOfWarRuntime()
  const usesGpuFog = shouldUseGpuFog(variant, fogOfWar)
  const fogCell = useMemo(
    () => (variant === 'floor' ? parseFogCellKey(variantKey) : null),
    [variant, variantKey],
  )
  const scene = useMemo(() => {
    const clone = cloneSceneWithNodeMaterials(gltf.scene)
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = castShadow
        obj.receiveShadow = receiveShadow
      }
    })
    return clone
  }, [castShadow, gltf.scene, receiveShadow])

  useEffect(() => {
    applyFogOfWarToObject(scene, usesGpuFog ? fogOfWar : null, {
      variant,
      cell: fogCell,
    })
  }, [fogCell, fogOfWar, scene, usesGpuFog, variant])

  const shouldRenderBase =
    !overlayOnly && (usesGpuFog || shouldRenderLineOfSightGeometry(visibility ?? 'visible', useLineOfSightPostMask))
  const canShowOverlay = (visibility ?? 'visible') !== 'hidden'

    return (
      <group {...groupProps}>
        {shouldRenderBase && <primitive object={scene} />}
        {tint && shouldRenderBase && canShowOverlay && (
          <TintOverlay
            source={scene}
          color={tint}
          opacity={tintOpacity}
          refreshKey={variantKey ?? assetPath}
        />
      )}
      {!overlayOnly && !usesGpuFog && visibility === 'explored' && (
        <TintOverlay
          source={scene}
          color="#050609"
          opacity={0.6}
        />
      )}
    </group>
  )
}

function ComponentAsset({
  Component,
  componentProps,
  receiveShadow,
  castShadow,
  selected,
  tint,
  tintOpacity,
  overlayOnly,
  visibility,
  useLineOfSightPostMask = false,
  variant,
  ...groupProps
}: ThreeElements['group'] & {
  Component: ComponentType<ContentPackComponentProps>
  componentProps: ContentPackComponentProps
  receiveShadow: boolean
  castShadow: boolean
  selected?: boolean
  tint?: string
  tintOpacity?: number
  overlayOnly?: boolean
  visibility?: PlayVisibilityState
  useLineOfSightPostMask?: boolean
  variant: ContentPackInstanceVariant
}) {
  const contentRef = useRef<THREE.Group>(null)
  const [overlaySource, setOverlaySource] = useState<THREE.Group | null>(null)
  const fogOfWar = useFogOfWarRuntime()
  const usesGpuFog = shouldUseGpuFog(variant, fogOfWar)
  const fogCell = useMemo(
    () => (variant === 'floor' ? parseFogCellKey(componentProps.variantKey) : null),
    [componentProps.variantKey, variant],
  )

  useLayoutEffect(() => {
    if (contentRef.current) {
      setOverlaySource(contentRef.current)
    }
  }, [])

  useEffect(() => {
    contentRef.current?.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = castShadow
        obj.receiveShadow = receiveShadow
      }
    })
  }, [castShadow, receiveShadow])

  useEffect(() => {
    if (contentRef.current) {
      applyFogOfWarToObject(contentRef.current, usesGpuFog ? fogOfWar : null, {
        variant,
        cell: fogCell,
      })
    }
  }, [fogCell, fogOfWar, usesGpuFog, variant])

  const shouldRenderBase =
    !overlayOnly && (usesGpuFog || shouldRenderLineOfSightGeometry(visibility ?? 'visible', useLineOfSightPostMask))
  const canShowOverlay = (visibility ?? 'visible') !== 'hidden'

  return (
    <group {...groupProps}>
      <group ref={contentRef} visible={shouldRenderBase}>
        <Component {...componentProps} />
      </group>
      {tint && overlaySource && shouldRenderBase && canShowOverlay && (
        <TintOverlay
          source={overlaySource}
          color={tint}
          opacity={tintOpacity}
          refreshKey={componentProps.variantKey}
        />
      )}
      {!overlayOnly && !usesGpuFog && visibility === 'explored' && overlaySource && (
        <TintOverlay
          source={overlaySource}
          color="#050609"
          opacity={0.6}
        />
      )}
    </group>
  )
}

function disableRaycast(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.raycast = () => {}
    }
  })
}

function markIgnoreLosRaycast(object: THREE.Object3D) {
  object.traverse((child) => {
    child.userData.ignoreLosRaycast = true
  })
}

function FallbackMesh({
  selected,
  tint,
  tintOpacity,
  overlayOnly,
  variant,
  variantKey,
  receiveShadow,
  castShadow = true,
  visibility = 'visible',
  useLineOfSightPostMask = false,
}: {
  selected: boolean
  tint?: string
  tintOpacity?: number
  overlayOnly?: boolean
  variant: ContentPackInstanceVariant
  variantKey?: string
  receiveShadow: boolean
  castShadow?: boolean
  visibility?: PlayVisibilityState
  useLineOfSightPostMask?: boolean
}) {
  const baseColor =
    variant === 'floor' ? '#34d399' : variant === 'wall' ? '#fbbf24' : '#7dd3fc'
  const color = tint ?? baseColor
  const emissive =
    variant === 'floor' ? '#059669' : variant === 'wall' ? '#d97706' : '#0ea5e9'
  const geometry =
    variant === 'floor'
      ? ([GRID_SIZE * 0.98, 0.06, GRID_SIZE * 0.98] as const)
      : variant === 'wall'
        ? ([GRID_SIZE * 0.96, 3, GRID_SIZE * 0.12] as const)
        : ([0.5, 0.9, 0.5] as const)
  const yOffset = variant === 'floor' ? 0.03 : variant === 'wall' ? 1.5 : 0
  const meshRef = useRef<THREE.Mesh>(null)
  const fogOfWar = useFogOfWarRuntime()
  const usesGpuFog = shouldUseGpuFog(variant, fogOfWar)
  const opacity = usesGpuFog
    ? 1
    : visibility === 'hidden'
      ? 0.08
      : visibility === 'explored'
        ? 0.45
        : 1
  const fogCell = useMemo(
    () => (variant === 'floor' ? parseFogCellKey(variantKey) : null),
    [variant, variantKey],
  )
  const material = useMemo(
    () => createStandardCompatibleMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      roughness: 0.45,
      metalness: 0.05,
      emissive: selected ? emissive : '#000000',
      emissiveIntensity: selected ? 0.18 : 0,
    }),
    [color, emissive, opacity, selected],
  )

  useEffect(() => {
    applyFogOfWarToMaterial(material, usesGpuFog ? fogOfWar : null, {
      variant,
      cell: fogCell,
    })
  }, [fogCell, fogOfWar, material, usesGpuFog, variant])

  useEffect(() => () => material.dispose(), [material])

  if (!overlayOnly && !usesGpuFog && !shouldRenderLineOfSightGeometry(visibility, useLineOfSightPostMask)) {
    return null
  }

  return (
    <mesh
      ref={meshRef}
      position={[0, yOffset, 0]}
      castShadow={!overlayOnly && castShadow}
      receiveShadow={!overlayOnly && receiveShadow}
    >
      <boxGeometry args={geometry} />
      {overlayOnly ? (
        <meshBasicMaterial
          color={color}
          transparent
          opacity={tintOpacity ?? 0.42}
          depthWrite={false}
        />
      ) : (
        <primitive object={material} attach="material" />
      )}
    </mesh>
  )
}

function parseFogCellKey(cellKey?: string): [number, number] | null {
  if (!cellKey) {
    return null
  }

  const [xText, zText] = cellKey.split(':')
  const x = Number.parseInt(xText ?? '', 10)
  const z = Number.parseInt(zText ?? '', 10)
  return Number.isFinite(x) && Number.isFinite(z) ? [x, z] : null
}
