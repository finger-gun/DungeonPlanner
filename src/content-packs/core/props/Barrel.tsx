/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import propsBarrelAssetUrl from '../../../assets/models/core/barrel.glb'
import propsBarrelThumbnailUrl from '../../../assets/models/core/barrel.png'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'

// Adjust this to compensate for the authored pivot of the prop.
const PROP_PIVOT_OFFSET = [0, 1, 0] as const

export function PropsBarrel(props: ContentPackComponentProps) {
  const gltf = useGLTF(propsBarrelAssetUrl)
  const scene = useMemo(() => cloneSceneWithNodeMaterials(gltf.scene), [gltf.scene])

  return (
    <group position={PROP_PIVOT_OFFSET}>
      <group {...props}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(propsBarrelAssetUrl)

export const propsBarrelAsset: ContentPackAsset = {
  id: 'core.props_barrel',
  slug: 'props_barrel',
  name: 'Barrel',
  category: 'prop',
  assetUrl: propsBarrelAssetUrl,
  thumbnailUrl: propsBarrelThumbnailUrl,
  Component: PropsBarrel,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
}
