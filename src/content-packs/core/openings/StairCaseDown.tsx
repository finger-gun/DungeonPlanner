/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import propsStairCaseAssetUrl from '../../../assets/models/core/staircase.glb'
import propsStairCaseThumbnailUrl from '../../../assets/models/core/staircase.png'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'

// Same orientation as StaircaseUp — hole and floor-tile skip handled in StaircaseHole.tsx
const PROP_PIVOT_OFFSET = [-1, -3, -1] as const

export function PropsStairCaseDown(props: ContentPackComponentProps) {
  const gltf = useGLTF(propsStairCaseAssetUrl)
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene])

  return (
    <group position={PROP_PIVOT_OFFSET}>
      <group rotation={[0, 0, 0]} {...props}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(propsStairCaseAssetUrl)

export const propsStairCaseDownAsset: ContentPackAsset = {
  id: 'core.props_staircase_down',
  slug: 'props_staircase_down',
  name: 'Staircase Down',
  category: 'opening',
  assetUrl: propsStairCaseAssetUrl,
  thumbnailUrl: propsStairCaseThumbnailUrl,
  Component: PropsStairCaseDown,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
    pairedAssetId: 'core.props_staircase_up',
  },
}
