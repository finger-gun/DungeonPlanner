/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import propsPillarAssetUrl from '../../../assets/models/core/pillar.glb'
import propsPillarThumbnailUrl from '../../../assets/models/core/pillar.png'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'

// Adjust this to compensate for the authored pivot of the prop.
const PROP_PIVOT_OFFSET = [0, 0, 0] as const

export function PropsPillar(props: ContentPackComponentProps) {
  const gltf = useGLTF(propsPillarAssetUrl)
  const scene = useMemo(() => cloneSceneWithNodeMaterials(gltf.scene), [gltf.scene])

  return (
    <group position={PROP_PIVOT_OFFSET}>
      <group {...props}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(propsPillarAssetUrl)

export const propsPillarAsset: ContentPackAsset = {
  id: 'core.props_pillar',
  slug: 'props_pillar',
  name: 'Pillar',
  category: 'prop',
  assetUrl: propsPillarAssetUrl,
  thumbnailUrl: propsPillarThumbnailUrl,
  Component: PropsPillar,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
}
