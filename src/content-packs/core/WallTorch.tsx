/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import propsWallTorchAssetUrl from '../../assets/models/core/wall_torch.glb'
import type { ContentPackAsset, ContentPackComponentProps } from '../types'

// Adjust this to compensate for the authored pivot of the prop.
const PROP_PIVOT_OFFSET = [0, 1, 0] as const

export function PropsWallTorch(props: ContentPackComponentProps) {
  const gltf = useGLTF(propsWallTorchAssetUrl)
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene])

  return (
    <group position={PROP_PIVOT_OFFSET}>
      <group {...props}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(propsWallTorchAssetUrl)

export const propsWallTorchAsset: ContentPackAsset = {
  id: 'core.props_wall_torch',
  slug: 'props_wall_torch',
  name: 'Wall Torch',
  category: 'prop',
  assetUrl: propsWallTorchAssetUrl,
  Component: PropsWallTorch,
  metadata: {
    connectsTo: 'WALL',
    light: {
      color: '#ff9040',
      intensity: 6,
      distance: 8,
      decay: 2,
      castShadow: true,
      flicker: true,
      // Offset from the prop's local origin — moves the light up to the flame
      offset: [0, 1.6, 0.25],
    },
  },
}
