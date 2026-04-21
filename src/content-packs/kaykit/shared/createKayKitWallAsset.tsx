import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'
import {
  KAYKIT_BASE_SCALE,
  requireKayKitModelAssetUrl,
  resolveKayKitAssetUrl,
} from './createKayKitAsset'

type KayKitWallAssetDefinition = {
  id: string
  slug: string
  name: string
  modelName: string
  thumbnailName?: string
  cornerModelName?: string
}

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

export function createKayKitWallAsset(definition: KayKitWallAssetDefinition): ContentPackAsset {
  const assetUrl = requireKayKitModelAssetUrl(definition.modelName)
  const cornerAssetUrl = requireKayKitModelAssetUrl(definition.cornerModelName ?? 'wall_corner_small')
  const thumbnailUrl = resolveKayKitAssetUrl(definition.thumbnailName ?? definition.modelName, 'png')

  function KayKitWallVariant({ objectProps, ...props }: ContentPackComponentProps) {
    const kind = objectProps?.kind === 'corner' ? 'corner' : 'wall'
    const modelUrl = kind === 'corner' ? cornerAssetUrl : assetUrl
    const gltf = useGLTF(modelUrl)
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

  useGLTF.preload(assetUrl)
  useGLTF.preload(cornerAssetUrl)

  return {
    id: definition.id,
    slug: definition.slug,
    name: definition.name,
    category: 'wall',
    assetUrl,
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
    Component: KayKitWallVariant,
    batchRender: {
      getAssetUrl: (_, objectProps) =>
        objectProps?.kind === 'corner' ? cornerAssetUrl : assetUrl,
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
}
