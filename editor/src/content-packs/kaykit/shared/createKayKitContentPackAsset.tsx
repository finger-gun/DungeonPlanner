import { useMemo } from 'react'
import { useGLTF } from '../../../rendering/useGLTF'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'
import type {
  ContentPackAsset,
  ContentPackAssetMetadata,
  ContentPackCategory,
  ContentPackComponentProps,
  ContentPackModelTransform,
} from '../../types'
import { resolveKayKitModelAssetUrl } from './createKayKitAsset'

type TransformTuple = readonly [number, number, number]
type ResolvedTransformTuple = [number, number, number]

export type KayKitTransform = {
  position?: TransformTuple
  rotation?: TransformTuple
  scale?: number | TransformTuple
}

type KayKitAssetDefinition = {
  id: string
  slug: string
  name: string
  category: ContentPackCategory
  modelName: string
  metadata?: ContentPackAssetMetadata
  transform?: KayKitTransform
}

const DEFAULT_POSITION = [0, 0, 0] as const
const DEFAULT_ROTATION = [0, 0, 0] as const
const DEFAULT_SCALE = 1
const THUMBNAIL_URLS = import.meta.glob('../../../assets/models/forrest/**/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>

const thumbnailAssetUrls = Object.fromEntries(
  Object.entries(THUMBNAIL_URLS).map(([key, url]) => [getAssetName(key), url]),
) as Record<string, string>

export function createKayKitContentPackAsset(definition: KayKitAssetDefinition): ContentPackAsset {
  const assetUrl = resolveKayKitModelAssetUrl(definition.modelName)
  if (!assetUrl) {
    throw new Error(`Missing KayKit model asset: ${definition.modelName}`)
  }

  const thumbnailUrl = resolveKayKitThumbnailAssetUrl(definition.modelName)
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
  }
}

function createStaticModelComponent(assetUrl: string, transform?: KayKitTransform) {
  const resolvedTransform = resolveTransform(transform)

  function KayKitModel(props: ContentPackComponentProps) {
    const gltf = useGLTF(assetUrl)
    const scene = useMemo(() => cloneSceneWithNodeMaterials(gltf.scene), [gltf.scene])

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

  return KayKitModel
}

function resolveKayKitThumbnailAssetUrl(name: string) {
  return thumbnailAssetUrls[name]
}

function getAssetName(key: string) {
  return key
    .split('/')
    .pop()
    ?.replace(/\.png$/i, '') ?? key
}

function resolveTransform(transform?: KayKitTransform) {
  return {
    position: transform?.position ?? DEFAULT_POSITION,
    rotation: transform?.rotation ?? DEFAULT_ROTATION,
    scale: resolveScale(transform?.scale),
  } satisfies ContentPackModelTransform
}

function resolveScale(scale: number | TransformTuple | undefined): number | ResolvedTransformTuple {
  if (scale === undefined) {
    return DEFAULT_SCALE
  }

  if (typeof scale === 'number') {
    return scale
  }

  return scale as ResolvedTransformTuple
}
