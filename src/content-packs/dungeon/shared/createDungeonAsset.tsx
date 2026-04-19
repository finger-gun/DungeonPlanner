import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import type {
  ContentPackAsset,
  ContentPackAssetMetadata,
  ContentPackCategory,
  ContentPackComponentProps,
  ContentPackModelTransform,
  PropLight,
} from '../../types'
import { DUNGEON_BASE_SCALE } from './dungeonConstants'

const MODEL_URLS = import.meta.glob('../../../assets/models/dungeon/*.glb', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const GLTF_URLS = import.meta.glob('../../../assets/models/dungeon/*.gltf', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const THUMBNAIL_URLS = import.meta.glob('../../../assets/models/dungeon/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

type TransformTuple = readonly [number, number, number]
type ResolvedTransformTuple = [number, number, number]

export type DungeonTransform = {
  position?: TransformTuple
  rotation?: TransformTuple
  scale?: number | TransformTuple
}

type DungeonAssetDefinition = {
  id: string
  slug: string
  name: string
  category: ContentPackCategory
  modelName: string
  thumbnailName?: string
  metadata?: ContentPackAssetMetadata
  transform?: DungeonTransform
  getLight?: (objectProps: Record<string, unknown>) => PropLight | null
  getPlayModeNextProps?: (objectProps: Record<string, unknown>) => Record<string, unknown> | null
}

const DEFAULT_POSITION = [0, 0, 0] as const
const DEFAULT_ROTATION = [0, 0, 0] as const

export function createDungeonAsset(definition: DungeonAssetDefinition): ContentPackAsset {
  const assetUrl = resolveDungeonModelAssetUrl(definition.modelName)
  const thumbnailUrl = resolveDungeonAssetUrl(definition.thumbnailName ?? definition.modelName, 'png')
  const resolvedTransform = resolveTransform(definition.transform)
  const Component = createStaticModelComponent(assetUrl, definition.transform)

  return {
    id: definition.id,
    slug: definition.slug,
    name: definition.name,
    category: definition.category,
    assetUrl,
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
    Component,
    batchRender: {
      getAssetUrl: () => assetUrl,
      transform: resolvedTransform,
    },
    projectionReceiver: {
      getAssetUrl: () => assetUrl,
      transform: resolvedTransform,
    },
    ...(definition.metadata ? { metadata: definition.metadata } : {}),
    ...(definition.getLight ? { getLight: definition.getLight } : {}),
    ...(definition.getPlayModeNextProps ? { getPlayModeNextProps: definition.getPlayModeNextProps } : {}),
  }
}

function createStaticModelComponent(assetUrl: string, transform?: DungeonTransform) {
  const resolvedTransform = resolveTransform(transform)

  function DungeonModel(props: ContentPackComponentProps) {
    const gltf = useGLTF(assetUrl)
    const scene = useMemo(() => gltf.scene.clone(), [gltf.scene])

    return (
      <group {...props}>
        <group
          position={resolvedTransform.position}
          rotation={resolvedTransform.rotation}
          scale={resolvedTransform.scale}
        >
          <primitive object={scene} />
        </group>
      </group>
    )
  }

  useGLTF.preload(assetUrl)
  return DungeonModel
}

export function resolveDungeonAssetUrl(name: string, extension: 'glb' | 'png') {
  const key = `../../../assets/models/dungeon/${name}.${extension}`
  const url = extension === 'glb' ? MODEL_URLS[key] : THUMBNAIL_URLS[key]
  return url ?? undefined
}

export function resolveDungeonModelAssetUrl(name: string) {
  return resolveDungeonAssetUrl(name, 'glb') ?? GLTF_URLS[`../../../assets/models/dungeon/${name}.gltf`]
}

function resolveTransform(transform?: DungeonTransform) {
  return {
    position: transform?.position ?? DEFAULT_POSITION,
    rotation: transform?.rotation ?? DEFAULT_ROTATION,
    scale: resolveScale(transform?.scale),
  } satisfies ContentPackModelTransform
}

function resolveScale(scale: number | TransformTuple | undefined): number | ResolvedTransformTuple {
  // If no scale provided, use default DUNGEON_BASE_SCALE
  if (scale === undefined) {
    return DUNGEON_BASE_SCALE
  }
  
  // If scale is explicitly provided, use it as-is (don't multiply by base scale)
  // This allows transforms like DUNGEON_FLOOR_TRANSFORM to set their own scale
  if (typeof scale === 'number') {
    return scale
  }
  
  return scale as ResolvedTransformTuple
}
