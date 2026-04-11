import { Suspense, useEffect, useLayoutEffect, useRef, useMemo, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { getContentPackAssetById } from '../../content-packs/registry'
import type { ComponentType } from 'react'
import type { ContentPackComponentProps } from '../../content-packs/types'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'

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
    const clone = source.clone(true)
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.material = mat
        obj.renderOrder = 999
      }
    })
    clone.scale.multiplyScalar(1.015)
    return clone
  }, [source])

  return <primitive object={outline} />
}

type ContentPackInstanceVariant = 'floor' | 'wall' | 'prop'

/** Semi-transparent colour overlay — clones the geometry with a translucent material. */
function TintOverlay({ source, color }: { source: THREE.Object3D; color: string }) {
  const overlay = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      side: THREE.FrontSide,
    })
    const clone = source.clone(true)
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.material = mat
        obj.renderOrder = 1
      }
    })
    return clone
  }, [source, color])

  return <primitive object={overlay} />
}

type ContentPackInstanceProps = ThreeElements['group'] & {
  assetId: string | null
  selected?: boolean
  tint?: string
  variant: ContentPackInstanceVariant
  variantKey?: string
}

export function ContentPackInstance({
  assetId,
  selected = false,
  tint,
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
        <FallbackMesh selected={selected} variant={variant} receiveShadow={receiveShadow} tint={tint} />
      </group>
    )
  }

  return (
    <Suspense
      fallback={
        <group {...groupProps}>
          <FallbackMesh selected={selected} variant={variant} receiveShadow={receiveShadow} tint={tint} />
        </group>
      }
    >
      {AssetComponent ? (
        <ComponentAsset
          Component={AssetComponent}
          componentProps={getComponentProps(variantKey)}
          receiveShadow={receiveShadow}
          selected={selected}
          tint={tint}
          {...groupProps}
        />
      ) : (
        <GLTFModel
          assetPath={assetPath}
          receiveShadow={receiveShadow}
          selected={selected}
          tint={tint}
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
  selected,
  tint,
  ...groupProps
}: ThreeElements['group'] & {
  assetPath: string
  receiveShadow: boolean
  selected?: boolean
  tint?: string
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
      {selected && <SelectionOutline source={scene} />}
      {tint && <TintOverlay source={scene} color={tint} />}
    </group>
  )
}

function ComponentAsset({
  Component,
  componentProps,
  receiveShadow,
  selected,
  tint,
  ...groupProps
}: ThreeElements['group'] & {
  Component: ComponentType<ContentPackComponentProps>
  componentProps: ContentPackComponentProps
  receiveShadow: boolean
  selected?: boolean
  tint?: string
}) {
  const groupRef = useRef<THREE.Group>(null)
  // Track mount so TintOverlay can access groupRef.current after first layout
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => {
    if (groupRef.current) setMounted(true)
  }, [])

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
      {selected && groupRef.current && <SelectionOutline source={groupRef.current} />}
      {tint && mounted && groupRef.current && <TintOverlay source={groupRef.current} color={tint} />}
    </group>
  )
}

function FallbackMesh({
  selected,
  tint,
  variant,
  receiveShadow,
}: {
  selected: boolean
  tint?: string
  variant: ContentPackInstanceVariant
  receiveShadow: boolean
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
