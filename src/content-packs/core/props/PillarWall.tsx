/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import propsPillarWallAssetUrl from '../../../assets/models/core/pillar.glb'
import propsPillarWallThumbnailUrl from '../../../assets/models/core/pillar.png'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'

// Adjust this to compensate for the authored pivot of the prop.
const PROP_PIVOT_OFFSET = [0, 0, 0] as const

export function PropsPillarWall(props: ContentPackComponentProps) {
  const gltf = useGLTF(propsPillarWallAssetUrl)
  const scene = useMemo(() => cloneSceneWithNodeMaterials(gltf.scene), [gltf.scene])

  return (
    <group position={PROP_PIVOT_OFFSET}>
      <group {...props}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(propsPillarWallAssetUrl)

export const propsPillarWallAsset: ContentPackAsset = {
  id: 'core.props_pillar_wall',
  slug: 'props_pillar_wall',
  name: 'Pillar Wall',
  category: 'prop',
  assetUrl: propsPillarWallAssetUrl,
  thumbnailUrl: propsPillarWallThumbnailUrl,
  Component: PropsPillarWall,
  metadata: {
    connectsTo: 'WALL',
  },
}
