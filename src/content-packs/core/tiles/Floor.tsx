/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import floorAssetUrl from '../../../assets/models/core/floor.glb'
import floor001AssetUrl from '../../../assets/models/core/floor_001.glb'
import floor002AssetUrl from '../../../assets/models/core/floor_002.glb'
import floor003AssetUrl from '../../../assets/models/core/floor_003.glb'
import floor004AssetUrl from '../../../assets/models/core/floor_004.glb'
import floor005AssetUrl from '../../../assets/models/core/floor_005.glb'
import floor006AssetUrl from '../../../assets/models/core/floor_006.glb'
import floor007AssetUrl from '../../../assets/models/core/floor_007.glb'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'

// Adjust this to compensate for the authored pivot of the floor set.
const FLOOR_PIVOT_OFFSET = [-1, 0, 1] as const

const FLOOR_VARIANT_URLS = [
  floorAssetUrl,
  floor001AssetUrl,
  floor002AssetUrl,
  floor003AssetUrl,
  floor004AssetUrl,
  floor005AssetUrl,
  floor006AssetUrl,
  floor007AssetUrl,
] as const

export function Floor({
  variantKey,
  ...props
}: ContentPackComponentProps) {
  const assetUrl =
    FLOOR_VARIANT_URLS[getVariantIndex(variantKey, FLOOR_VARIANT_URLS.length)]
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

function getVariantIndex(variantKey: string | undefined, variantCount: number) {
  if (!variantKey) {
    return 0
  }

  let hash = 0
  for (let index = 0; index < variantKey.length; index += 1) {
    hash = (hash * 31 + variantKey.charCodeAt(index)) >>> 0
  }

  return hash % variantCount
}

FLOOR_VARIANT_URLS.forEach((assetUrl) => {
  useGLTF.preload(assetUrl)
})

export const floorAsset: ContentPackAsset = {
  id: 'core.floor',
  slug: 'floor',
  name: 'Floor',
  category: 'floor',
  assetUrl: floorAssetUrl,
  Component: Floor,
}
