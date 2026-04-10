/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import doorWall3AssetUrl from '../../assets/models/core/door_wall_3.glb'
import type { ContentPackAsset, ContentPackComponentProps } from '../types'

const PROP_PIVOT_OFFSET = [0, 0, 0] as const

export function OpeningDoorWall3(props: ContentPackComponentProps) {
  const gltf = useGLTF(doorWall3AssetUrl)
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene])

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
  name: 'Door (3-wide)',
  category: 'opening',
  assetUrl: doorWall3AssetUrl,
  Component: OpeningDoorWall3,
  metadata: {
    openingWidth: 3,
  },
}
