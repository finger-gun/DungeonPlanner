import { Suspense, useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { getContentPackAssetById } from '../../content-packs/registry'
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

  useEffect(() => {
    if (assetPath) {
      useGLTF.preload(assetPath)
    }
  }, [assetPath])

  if (!assetPath) {
    return (
      <group scale={selected ? 1.06 : 1} {...groupProps}>
        <FallbackMesh selected={selected} variant={variant} />
      </group>
    )
  }

  return (
    <Suspense
      fallback={
        <group scale={selected ? 1.06 : 1} {...groupProps}>
          <FallbackMesh selected={selected} variant={variant} />
        </group>
      }
    >
      {AssetComponent ? (
        <group scale={selected ? 1.06 : 1} {...groupProps}>
          <AssetComponent {...getComponentProps(variantKey)} />
        </group>
      ) : (
        <GLTFModel
          assetPath={assetPath}
          scale={selected ? 1.06 : 1}
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
  ...groupProps
}: ThreeElements['group'] & {
  assetPath: string
}) {
  const gltf = useGLTF(assetPath)
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene])

  return (
    <group {...groupProps}>
      <primitive object={scene} />
    </group>
  )
}

function FallbackMesh({
  selected,
  variant,
}: {
  selected: boolean
  variant: ContentPackInstanceVariant
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
    <mesh position={[0, yOffset, 0]} scale={selected ? 1.04 : 1}>
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
