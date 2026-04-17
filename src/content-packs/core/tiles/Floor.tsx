/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'
import {
  FLOOR_PIVOT_OFFSET,
  FLOOR_VARIANT_URLS,
  getFloorVariantAssetUrl,
} from './floorVariants'

export function Floor({
  variantKey,
  ...props
}: ContentPackComponentProps) {
  const assetUrl = getFloorVariantAssetUrl(variantKey)
  const gltf = useGLTF(assetUrl)
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene])

  return (
    <group position={FLOOR_PIVOT_OFFSET}>
      <group {...props}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

FLOOR_VARIANT_URLS.forEach((assetUrl) => {
  useGLTF.preload(assetUrl)
})

export const floorAsset: ContentPackAsset = {
  id: 'core.floor',
  slug: 'floor',
  name: 'Floor',
  category: 'floor',
  assetUrl: FLOOR_VARIANT_URLS[0],
  Component: Floor,
  projectionReceiver: {
    getAssetUrl: getFloorVariantAssetUrl,
    transform: {
      position: [...FLOOR_PIVOT_OFFSET],
    },
  },
}
