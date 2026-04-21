/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import propsWallTorchAssetUrl from '../../../assets/models/core/torch.glb'
import propsWallTorchLitAssetUrl from '../../../assets/models/core/tortch_lit.glb'
import propsWallTorchThumbnailUrl from '../../../assets/models/core/props_wall_torch.png'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'

// Adjust this to compensate for the authored pivot of the prop.
const PROP_PIVOT_OFFSET = [0, 1, 0] as const

const TORCH_LIGHT = {
  color: '#ff9040',
  intensity: 5,
  distance: 10,
  decay: 1,
  castShadow: false,
  flicker: true,
  offset: [0, 2, 1] as [number, number, number],
}

export function PropsWallTorch({ objectProps, ...props }: ContentPackComponentProps) {
  const lit = objectProps?.lit !== false
  const gltf = useGLTF(lit ? propsWallTorchLitAssetUrl : propsWallTorchAssetUrl)
  const scene = useMemo(() => cloneSceneWithNodeMaterials(gltf.scene), [gltf.scene])

  return (
    <group position={PROP_PIVOT_OFFSET}>
      <group {...props}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(propsWallTorchAssetUrl)
useGLTF.preload(propsWallTorchLitAssetUrl)

export const propsWallTorchAsset: ContentPackAsset = {
  id: 'core.props_wall_torch',
  slug: 'props_wall_torch',
  name: 'Wall Torch',
  category: 'prop',
  assetUrl: propsWallTorchAssetUrl,
  thumbnailUrl: propsWallTorchThumbnailUrl,
  Component: PropsWallTorch,
  getLight: (objectProps) => (objectProps.lit === false ? null : TORCH_LIGHT),
  getPlayModeNextProps: (objectProps) => ({
    ...objectProps,
    lit: objectProps.lit === false,
  }),
  metadata: {
    connectsTo: 'WALL',
  },
}
