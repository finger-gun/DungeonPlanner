/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import propsStairCaseUpAssetUrl from '../../../assets/models/core/staircase.glb'
import propsStairCaseUpThumbnailUrl from '../../../assets/models/core/staircase.png'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'

// Adjust this to compensate for the authored pivot of the prop.
const PROP_PIVOT_OFFSET = [-1, 0, -1] as const

export function PropsStairCaseUp(props: ContentPackComponentProps) {
  const gltf = useGLTF(propsStairCaseUpAssetUrl)
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene])

  return (
    <group position={PROP_PIVOT_OFFSET}>
      <group {...props}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(propsStairCaseUpAssetUrl)

export const propsStairCaseUpAsset: ContentPackAsset = {
  id: 'core.props_staircase_up',
  slug: 'props_staircase_up',
  name: 'Staircase Up',
  category: 'opening',
  assetUrl: propsStairCaseUpAssetUrl,
  thumbnailUrl: propsStairCaseUpThumbnailUrl,
  Component: PropsStairCaseUp,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'up',
    pairedAssetId: 'core.props_staircase_down',
  },
}
