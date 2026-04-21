/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import doorWall3AssetUrl from '../../../assets/models/core/door_wall_3.glb'
import doorWall3ThumbnailUrl from '../../../assets/models/core/door_wall_3.png'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'

const PROP_PIVOT_OFFSET = [-1, 0, 0] as const

export function OpeningDoorWall3(props: ContentPackComponentProps) {
  const gltf = useGLTF(doorWall3AssetUrl)
  const scene = useMemo(() => cloneSceneWithNodeMaterials(gltf.scene), [gltf.scene])

  return (
    <group position={PROP_PIVOT_OFFSET}>
      <group {...props}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(doorWall3AssetUrl)

export const openingDoorWall3Asset: ContentPackAsset = {
  id: 'core.opening_door_wall_3',
  slug: 'opening_door_wall_3',
  name: 'Large door',
  category: 'opening',
  assetUrl: doorWall3AssetUrl,
  thumbnailUrl: doorWall3ThumbnailUrl,
  Component: OpeningDoorWall3,
  metadata: {
    openingWidth: 3,
    connectsTo: 'WALL',
  },
}
