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

const MODEL_URLS = import.meta.glob('../../../assets/models/kaykit/*.glb', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const GLTF_URLS = import.meta.glob('../../../assets/models/kaykit/*.gltf', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const THUMBNAIL_URLS = import.meta.glob('../../../assets/models/kaykit/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

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
  thumbnailName?: string
  metadata?: ContentPackAssetMetadata
  transform?: KayKitTransform
  getLight?: (objectProps: Record<string, unknown>) => PropLight | null
  getPlayModeNextProps?: (objectProps: Record<string, unknown>) => Record<string, unknown> | null
}

const DEFAULT_POSITION = [0, 0, 0] as const
const DEFAULT_ROTATION = [0, 0, 0] as const
export const KAYKIT_BASE_SCALE = 0.5

export function createKayKitAsset(definition: KayKitAssetDefinition): ContentPackAsset {
  const assetUrl = resolveKayKitModelAssetUrl(definition.modelName)
  const thumbnailUrl = resolveKayKitAssetUrl(definition.thumbnailName ?? definition.modelName, 'png')
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

function createStaticModelComponent(assetUrl: string, transform?: KayKitTransform) {
  const resolvedTransform = resolveTransform(transform)

  function KayKitModel(props: ContentPackComponentProps) {
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
  return KayKitModel
}

export function resolveKayKitAssetUrl(name: string, extension: 'glb' | 'png') {
  const key = `../../../assets/models/kaykit/${name}.${extension}`
  const url = extension === 'glb' ? MODEL_URLS[key] : THUMBNAIL_URLS[key]
  return url ?? undefined
}

export function resolveKayKitModelAssetUrl(name: string) {
  return resolveKayKitAssetUrl(name, 'glb') ?? GLTF_URLS[`../../../assets/models/kaykit/${name}.gltf`]
}

function resolveTransform(transform?: KayKitTransform) {
  return {
    position: transform?.position ?? DEFAULT_POSITION,
    rotation: transform?.rotation ?? DEFAULT_ROTATION,
    scale: scaleKayKitScale(transform?.scale),
  } satisfies ContentPackModelTransform
}

function scaleKayKitScale(scale: number | TransformTuple | undefined): number | ResolvedTransformTuple {
  const resolvedScale = scale ?? 1
  if (typeof resolvedScale === 'number') {
    return resolvedScale * KAYKIT_BASE_SCALE
  }

  return resolvedScale.map((value) => value * KAYKIT_BASE_SCALE) as ResolvedTransformTuple
}
