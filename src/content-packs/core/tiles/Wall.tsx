/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import wallAssetUrl from '../../../assets/models/core/wall.glb'
import wall001AssetUrl from '../../../assets/models/core/wall_001.glb'
import wall002AssetUrl from '../../../assets/models/core/wall_002.glb'
import wall003AssetUrl from '../../../assets/models/core/wall_003.glb'
import wall004AssetUrl from '../../../assets/models/core/wall_004.glb'
import wall005AssetUrl from '../../../assets/models/core/wall_005.glb'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'

// Adjust this to compensate for the authored pivot of the wall set.
const WALL_PIVOT_OFFSET = [0, 0, 0] as const

const WALL_VARIANT_URLS = [
  wallAssetUrl,
  wall001AssetUrl,
  wall002AssetUrl,
  wall003AssetUrl,
  wall004AssetUrl,
  wall005AssetUrl,
] as const

export function Wall({
  variantKey,
  ...props
}: ContentPackComponentProps) {
  const assetUrl =
    WALL_VARIANT_URLS[getVariantIndex(variantKey, WALL_VARIANT_URLS.length)]
  const gltf = useGLTF(assetUrl)
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene])

  return (
    <group position={WALL_PIVOT_OFFSET}>
      <group {...props}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

export function getWallVariantAssetUrl(variantKey: string | undefined) {
  return WALL_VARIANT_URLS[getVariantIndex(variantKey, WALL_VARIANT_URLS.length)]
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

WALL_VARIANT_URLS.forEach((assetUrl) => {
  useGLTF.preload(assetUrl)
})

export const wallAsset: ContentPackAsset = {
  id: 'core.wall',
  slug: 'wall',
  name: 'Wall',
  category: 'wall',
  assetUrl: wallAssetUrl,
  Component: Wall,
  batchRender: {
    getAssetUrl: getWallVariantAssetUrl,
    transform: {
      position: WALL_PIVOT_OFFSET,
    },
  },
}
