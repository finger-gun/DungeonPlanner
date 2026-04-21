/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import doorWall1AssetUrl from '../../../assets/models/core/door_wall_1.glb'
import doorWall1ThumbnailUrl from '../../../assets/models/core/door_wall_1.png'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'

const PROP_PIVOT_OFFSET = [-1, 0, 0] as const

export function OpeningDoorWall1(props: ContentPackComponentProps) {
  const gltf = useGLTF(doorWall1AssetUrl)
  const scene = useMemo(() => cloneSceneWithNodeMaterials(gltf.scene), [gltf.scene])

  return (
    <group position={PROP_PIVOT_OFFSET}>
      <group {...props}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(doorWall1AssetUrl)

export const openingDoorWall1Asset: ContentPackAsset = {
  id: 'core.opening_door_wall_1',
  slug: 'opening_door_wall_1',
  name: 'Small door',
  category: 'opening',
  assetUrl: doorWall1AssetUrl,
  thumbnailUrl: doorWall1ThumbnailUrl,
  Component: OpeningDoorWall1,
  metadata: {
    openingWidth: 1,
    connectsTo: 'WALL',
  },
}
