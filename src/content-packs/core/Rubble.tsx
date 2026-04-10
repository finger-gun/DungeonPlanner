/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import rubbleAssetUrl from '../../assets/models/core/rubble.glb'
import rubble001AssetUrl from '../../assets/models/core/rubble_001.glb'
import rubble002AssetUrl from '../../assets/models/core/rubble_002.glb'
import rubble003AssetUrl from '../../assets/models/core/rubble_003.glb'

import type { ContentPackAsset, ContentPackComponentProps } from '../types'

// Adjust this to compensate for the authored pivot of the prop.
const PROP_PIVOT_OFFSET = [0, 0.4, 0] as const

const RUBBLE_VARIANT_URLS = [
  rubbleAssetUrl,
  rubble001AssetUrl,
  rubble002AssetUrl,
  rubble003AssetUrl,
] as const

export function PropsRubble({ variantKey, ...props }: ContentPackComponentProps) {
  const assetUrl = RUBBLE_VARIANT_URLS[getVariantIndex(variantKey, RUBBLE_VARIANT_URLS.length)]
  const gltf = useGLTF(assetUrl)
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene])

  return (
    <group position={PROP_PIVOT_OFFSET}>
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

RUBBLE_VARIANT_URLS.forEach((assetUrl) => {
  useGLTF.preload(assetUrl)
})

export const propsRubbleAsset: ContentPackAsset = {
  id: 'core.props_rubble',
  slug: 'props_rubble',
  name: 'Rubble',
  category: 'prop',
  assetUrl: rubbleAssetUrl,
  Component: PropsRubble,
  metadata: {
    connectsTo: 'FLOOR',
  },
}
