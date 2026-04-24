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

export function createKayKitContentPackAsset(definition: KayKitAssetDefinition): ContentPackAsset {
  const assetUrl = resolveKayKitModelAssetUrl(definition.modelName)
  if (!assetUrl) {
    throw new Error(`Missing KayKit model asset: ${definition.modelName}`)
  }

  const resolvedTransform = resolveTransform(definition.transform)
  const Component = createStaticModelComponent(assetUrl, definition.transform)

  return {
    id: definition.id,
    slug: definition.slug,
    name: definition.name,
    category: definition.category,
    assetUrl,
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
