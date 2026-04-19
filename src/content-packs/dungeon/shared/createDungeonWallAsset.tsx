import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'
import { DUNGEON_BASE_SCALE } from './dungeonConstants'

type DungeonWallAssetDefinition = {
  id: string
  slug: string
  name: string
  modelName: string
  thumbnailName?: string
  cornerModelName?: string
}

// Corner pieces in KayKit dungeon are 2.5x2.5 (to cover 2.0 grid corner + 0.5 wall thickness)
// Regular walls are 2.0 wide (one grid cell) + 1.0 thick
// The corner scale needs to be adjusted to fit properly
const WALL_CORNER_SCALE = [
  (4 / 3) * DUNGEON_BASE_SCALE,
  DUNGEON_BASE_SCALE,
  (4 / 3) * DUNGEON_BASE_SCALE,
] as const
const WALL_CORNER_ROTATION = [0, Math.PI * 1.5, 0] as const
const WALL_DEFAULT_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: DUNGEON_BASE_SCALE,
}

export function createDungeonWallAsset(definition: DungeonWallAssetDefinition): ContentPackAsset {
  const modelUrls = import.meta.glob('../../../assets/models/dungeon/*.glb', {
    eager: true,
    import: 'default',
  }) as Record<string, string>

  const thumbnailUrls = import.meta.glob('../../../assets/models/dungeon/*.png', {
    eager: true,
    import: 'default',
  }) as Record<string, string>

  const assetUrl = modelUrls[`../../../assets/models/dungeon/${definition.modelName}.glb`]
  const cornerAssetUrl = modelUrls[`../../../assets/models/dungeon/${definition.cornerModelName ?? 'wall_corner'}.glb`]
  const thumbnailUrl = thumbnailUrls[`../../../assets/models/dungeon/${definition.thumbnailName ?? definition.modelName}.png`]

  function DungeonWallVariant({ objectProps, ...props }: ContentPackComponentProps) {
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
    Component: DungeonWallVariant,
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
