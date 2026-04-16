import { Suspense, useEffect, useLayoutEffect, useRef, useMemo, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { getContentPackAssetById } from '../../content-packs/registry'
import type { ComponentType } from 'react'
import type { ContentPackComponentProps } from '../../content-packs/types'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'
import type { PlayVisibilityState } from './playVisibility'

/** Inverted-hull outline: a slightly scaled-up back-face clone with a
 *  bright emissive rim material. Works with any geometry/GLTF. */
function SelectionOutline({ source }: { source: THREE.Object3D }) {
  const outline = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#ff4444',
      emissive: '#ff2222',
      emissiveIntensity: 1.5,
      side: THREE.BackSide,
      depthWrite: false,
      transparent: true,
      opacity: 0.9,
    })
    const clone = SkeletonUtils.clone(source)
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.material = mat
        obj.renderOrder = 999
      }
    })
    markIgnoreLosRaycast(clone)
    disableRaycast(clone)
    clone.scale.multiplyScalar(1.015)
    return clone
  }, [source])

  return <primitive object={outline} />
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
  variant,
  variantKey,
  objectProps,
  ...groupProps
}: ContentPackInstanceProps) {
  const asset = assetId ? getContentPackAssetById(assetId) : null
  const assetPath = asset?.assetUrl
  const AssetComponent = asset?.Component ?? null
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
          receiveShadow={receiveShadow}
          tint={tint}
          tintOpacity={tintOpacity}
          overlayOnly={overlayOnly}
          visibility={visibility}
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
            receiveShadow={receiveShadow}
            tint={tint}
            tintOpacity={tintOpacity}
            overlayOnly={overlayOnly}
            visibility={visibility}
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
          selected={selected}
           tint={tint}
           tintOpacity={tintOpacity}
           overlayOnly={overlayOnly}
          visibility={visibility}
          {...groupProps}
        />
      ) : (
        <GLTFModel
          assetPath={assetPath!}
          receiveShadow={receiveShadow}
          selected={selected}
          tint={tint}
          tintOpacity={tintOpacity}
          overlayOnly={overlayOnly}
          visibility={visibility}
          variantKey={variantKey}
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
  selected,
  tint,
  tintOpacity,
  overlayOnly,
  visibility,
  variantKey,
  ...groupProps
}: ThreeElements['group'] & {
  assetPath: string
  receiveShadow: boolean
  selected?: boolean
  tint?: string
  tintOpacity?: number
  overlayOnly?: boolean
  visibility?: PlayVisibilityState
  variantKey?: string
}) {
  const gltf = useGLTF(assetPath)
  const scene = useMemo(() => {
    const clone = gltf.scene.clone()
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true
        obj.receiveShadow = receiveShadow
      }
    })
    return clone
  }, [gltf.scene, receiveShadow])

  return (
    <group {...groupProps}>
      {!overlayOnly && <primitive object={scene} />}
      {!overlayOnly && selected && <SelectionOutline source={scene} />}
      {tint && (
        <TintOverlay
          source={scene}
          color={tint}
          opacity={tintOpacity}
          refreshKey={variantKey ?? assetPath}
        />
      )}
      {!overlayOnly && visibility !== 'visible' && (
        <TintOverlay
          source={scene}
          color="#050609"
          opacity={visibility === 'hidden' ? 0.94 : 0.6}
        />
      )}
    </group>
  )
}

function ComponentAsset({
  Component,
  componentProps,
  receiveShadow,
  selected,
  tint,
  tintOpacity,
  overlayOnly,
  visibility,
  ...groupProps
}: ThreeElements['group'] & {
  Component: ComponentType<ContentPackComponentProps>
  componentProps: ContentPackComponentProps
  receiveShadow: boolean
  selected?: boolean
  tint?: string
  tintOpacity?: number
  overlayOnly?: boolean
  visibility?: PlayVisibilityState
}) {
  const contentRef = useRef<THREE.Group>(null)
  const [overlaySource, setOverlaySource] = useState<THREE.Group | null>(null)

  useLayoutEffect(() => {
    if (contentRef.current) {
      setOverlaySource(contentRef.current)
    }
  }, [])

  useEffect(() => {
    contentRef.current?.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true
        obj.receiveShadow = receiveShadow
      }
    })
  }, [receiveShadow])

  return (
    <group {...groupProps}>
      <group ref={contentRef} visible={!overlayOnly}>
        <Component {...componentProps} />
      </group>
      {!overlayOnly && selected && overlaySource && <SelectionOutline source={overlaySource} />}
      {tint && overlaySource && (
        <TintOverlay
          source={overlaySource}
          color={tint}
          opacity={tintOpacity}
          refreshKey={componentProps.variantKey}
        />
      )}
      {!overlayOnly && visibility !== 'visible' && overlaySource && (
        <TintOverlay
          source={overlaySource}
          color="#050609"
          opacity={visibility === 'hidden' ? 0.94 : 0.6}
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
  receiveShadow,
  visibility = 'visible',
}: {
  selected: boolean
  tint?: string
  tintOpacity?: number
  overlayOnly?: boolean
  variant: ContentPackInstanceVariant
  receiveShadow: boolean
  visibility?: PlayVisibilityState
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
  const opacity = visibility === 'hidden' ? 0.08 : visibility === 'explored' ? 0.45 : 1

  return (
    <mesh position={[0, yOffset, 0]} castShadow={!overlayOnly} receiveShadow={!overlayOnly && receiveShadow}>
      <boxGeometry args={geometry} />
      {overlayOnly ? (
        <meshBasicMaterial
          color={color}
          transparent
          opacity={tintOpacity ?? 0.42}
          depthWrite={false}
        />
      ) : (
        <meshStandardMaterial
          color={color}
          transparent={opacity < 1}
          opacity={opacity}
          roughness={0.45}
          metalness={0.05}
          emissive={selected ? emissive : '#000000'}
          emissiveIntensity={selected ? 0.18 : 0}
        />
      )}
    </mesh>
  )
}
