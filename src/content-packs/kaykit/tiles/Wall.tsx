/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'
import { KAYKIT_BASE_SCALE, resolveKayKitAssetUrl } from '../shared/createKayKitAsset'

const wallAssetUrl = resolveKayKitAssetUrl('wall', 'glb')
const wallCornerSmallAssetUrl = resolveKayKitAssetUrl('wall_corner_small', 'glb')
const wallThumbnailUrl = resolveKayKitAssetUrl('wall', 'png')

const WALL_CORNER_SCALE = [
  (4 / 3) * KAYKIT_BASE_SCALE,
  KAYKIT_BASE_SCALE,
  (4 / 3) * KAYKIT_BASE_SCALE,
] as const
const WALL_CORNER_ROTATION = [0, Math.PI * 1.5, 0] as const
const WALL_DEFAULT_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: KAYKIT_BASE_SCALE,
}

export function KayKitWall({ objectProps, ...props }: ContentPackComponentProps) {
  const kind = objectProps?.kind === 'corner' ? 'corner' : 'wall'
  const assetUrl = kind === 'corner' ? wallCornerSmallAssetUrl : wallAssetUrl
  const gltf = useGLTF(assetUrl)
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene])
  const transform = kind === 'corner'
    ? { position: [0, 0, 0] as const, rotation: WALL_CORNER_ROTATION, scale: WALL_CORNER_SCALE }
    : WALL_DEFAULT_TRANSFORM

  return (
    <group {...props}>
      <group position={transform.position} rotation={transform.rotation} scale={transform.scale}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(wallAssetUrl)
useGLTF.preload(wallCornerSmallAssetUrl)

export const kaykitWallAsset: ContentPackAsset = {
  id: 'kaykit.wall',
  slug: 'kaykit-wall',
  name: 'KayKit Wall',
  category: 'wall',
  assetUrl: wallAssetUrl,
  ...(wallThumbnailUrl ? { thumbnailUrl: wallThumbnailUrl } : {}),
  Component: KayKitWall,
  batchRender: {
    getAssetUrl: (_, objectProps) =>
      objectProps?.kind === 'corner' ? wallCornerSmallAssetUrl : wallAssetUrl,
    transform: (_, objectProps) => (
      objectProps?.kind === 'corner'
        ? { position: [0, 0, 0] as const, rotation: WALL_CORNER_ROTATION, scale: WALL_CORNER_SCALE }
        : WALL_DEFAULT_TRANSFORM
    ),
  },
  metadata: {
    wallSpan: 1,
    wallCornerType: 'solitary',
  },
}
