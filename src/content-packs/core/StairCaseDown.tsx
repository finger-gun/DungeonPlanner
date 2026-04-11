/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import propsStairCaseAssetUrl from '../../assets/models/core/staircase.glb'
import type { ContentPackAsset, ContentPackComponentProps } from '../types'

// Rotated 180° on Y so the staircase descends in the opposite direction.
const PROP_PIVOT_OFFSET = [-1, -3, -1] as const

export function PropsStairCaseDown(props: ContentPackComponentProps) {
  const gltf = useGLTF(propsStairCaseAssetUrl)
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene])

  return (
    <group position={PROP_PIVOT_OFFSET}>
      <group rotation={[0, Math.PI, 0]} {...props}>
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
  category: 'prop',
  assetUrl: propsStairCaseAssetUrl,
  Component: PropsStairCaseDown,
  metadata: {
    connectsTo: 'FLOOR',
  },
}
