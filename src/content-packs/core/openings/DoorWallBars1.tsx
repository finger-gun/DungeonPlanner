/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import doorWallBars1AssetUrl from '../../../assets/models/core/door_wall_bars_1.glb'
import doorWallBars1ThumbnailUrl from '../../../assets/models/core/door_wall_bars_1.png'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'

const PROP_PIVOT_OFFSET = [0, 1, 0] as const

export function OpeningDoorWallBars1(props: ContentPackComponentProps) {
  const gltf = useGLTF(doorWallBars1AssetUrl)
  const scene = useMemo(() => cloneSceneWithNodeMaterials(gltf.scene), [gltf.scene])

  return (
    <group position={PROP_PIVOT_OFFSET}>
      <group {...props}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(doorWallBars1AssetUrl)

export const openingDoorWallBars1Asset: ContentPackAsset = {
  id: 'core.opening_door_wall_bars_1',
  slug: 'opening_door_wall_bars_1',
  name: 'Small door with bars',
  category: 'opening',
  assetUrl: doorWallBars1AssetUrl,
  thumbnailUrl: doorWallBars1ThumbnailUrl,
  Component: OpeningDoorWallBars1,
  metadata: {
    openingWidth: 1,
    connectsTo: 'WALL',
  },
}
