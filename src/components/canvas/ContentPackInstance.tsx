import { Suspense, useEffect, useRef, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { getContentPackAssetById } from '../../content-packs/registry'
import type { ComponentType } from 'react'
import type { ContentPackComponentProps } from '../../content-packs/types'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'

type ContentPackInstanceVariant = 'floor' | 'wall' | 'prop'

type ContentPackInstanceProps = ThreeElements['group'] & {
  assetId: string | null
  selected?: boolean
  variant: ContentPackInstanceVariant
  variantKey?: string
}

export function ContentPackInstance({
  assetId,
  selected = false,
  variant,
  variantKey,
  ...groupProps
}: ContentPackInstanceProps) {
  const asset = assetId ? getContentPackAssetById(assetId) : null
  const assetPath = asset?.assetUrl
  const AssetComponent = asset?.Component ?? null
  const receiveShadow = asset?.metadata?.receiveShadow !== false

  useEffect(() => {
    if (assetPath) {
      useGLTF.preload(assetPath)
    }
  }, [assetPath])

  if (!assetPath) {
    return (
      <group {...groupProps}>
        <FallbackMesh selected={selected} variant={variant} receiveShadow={receiveShadow} />
      </group>
    )
  }

  return (
    <Suspense
      fallback={
        <group {...groupProps}>
          <FallbackMesh selected={selected} variant={variant} receiveShadow={receiveShadow} />
        </group>
      }
    >
      {AssetComponent ? (
        <ComponentAsset
          Component={AssetComponent}
          componentProps={getComponentProps(variantKey)}
          receiveShadow={receiveShadow}
          {...groupProps}
        />
      ) : (
        <GLTFModel
          assetPath={assetPath}
          receiveShadow={receiveShadow}
          {...groupProps}
        />
      )}
    </Suspense>
  )
}

function getComponentProps(variantKey?: string): ContentPackComponentProps {
  return variantKey ? { variantKey } : {}
}

function GLTFModel({
  assetPath,
  receiveShadow,
  ...groupProps
}: ThreeElements['group'] & {
  assetPath: string
  receiveShadow: boolean
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
      <primitive object={scene} />
    </group>
  )
}

function ComponentAsset({
  Component,
  componentProps,
  receiveShadow,
  ...groupProps
}: ThreeElements['group'] & {
  Component: ComponentType<ContentPackComponentProps>
  componentProps: ContentPackComponentProps
  receiveShadow: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    groupRef.current?.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true
        obj.receiveShadow = receiveShadow
      }
    })
  }, [receiveShadow])

  return (
    <group ref={groupRef} {...groupProps}>
      <Component {...componentProps} />
    </group>
  )
}

function FallbackMesh({
  selected,
  variant,
  receiveShadow,
}: {
  selected: boolean
  variant: ContentPackInstanceVariant
  receiveShadow: boolean
}) {
  const color =
    variant === 'floor' ? '#34d399' : variant === 'wall' ? '#fbbf24' : '#7dd3fc'
  const emissive =
    variant === 'floor' ? '#059669' : variant === 'wall' ? '#d97706' : '#0ea5e9'
  const geometry =
    variant === 'floor'
      ? ([GRID_SIZE * 0.98, 0.06, GRID_SIZE * 0.98] as const)
      : variant === 'wall'
        ? ([GRID_SIZE * 0.96, 3, GRID_SIZE * 0.12] as const)
        : ([0.5, 0.9, 0.5] as const)
  const yOffset = variant === 'floor' ? 0.03 : variant === 'wall' ? 1.5 : 0

  return (
    <mesh position={[0, yOffset, 0]} castShadow receiveShadow={receiveShadow}>
      <boxGeometry args={geometry} />
      <meshStandardMaterial
        color={color}
        roughness={0.45}
        metalness={0.05}
        emissive={selected ? emissive : '#000000'}
        emissiveIntensity={selected ? 0.18 : 0}
      />
    </mesh>
  )
}
