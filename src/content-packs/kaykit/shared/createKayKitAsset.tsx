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
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const BINARY_URLS = import.meta.glob('../../../assets/models/kaykit/*.bin', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const TEXTURE_URLS = import.meta.glob('../../../assets/models/kaykit/*.{png,jpg,jpeg,webp}', {
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
  const assetUrl = requireKayKitModelAssetUrl(definition.modelName)
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
  const modelUrl = resolveKayKitAssetUrl(name, 'glb')
  if (modelUrl) {
    return modelUrl
  }

  const gltfKey = `../../../assets/models/kaykit/${name}.gltf`
  const source = GLTF_URLS[gltfKey]
  if (!source) {
    return undefined
  }

  const parsed = JSON.parse(source) as {
    buffers?: Array<{ uri?: string }>
    images?: Array<{ uri?: string }>
  }
  const patched = {
    ...parsed,
    buffers: parsed.buffers?.map((buffer) => ({
      ...buffer,
      uri: resolveExternalGltfUri(buffer.uri),
    })),
    images: parsed.images?.map((image) => ({
      ...image,
      uri: resolveExternalGltfUri(image.uri),
    })),
  }
  return `data:model/gltf+json;base64,${encodeBase64(JSON.stringify(patched))}`
}

export function requireKayKitModelAssetUrl(name: string) {
  const url = resolveKayKitModelAssetUrl(name)
  if (url) {
    return url
  }

  throw new Error(`Missing KayKit model asset: ${name}`)
}

function resolveExternalGltfUri(uri: string | undefined) {
  if (!uri || isExternalUri(uri)) {
    return uri
  }

  const clean = uri.split('?')[0]?.split('#')[0] ?? uri
  const fileName = clean.split('/').at(-1)
  if (!fileName) {
    return uri
  }

  const key = `../../../assets/models/kaykit/${fileName}`
  const extension = fileName.split('.').at(-1)?.toLowerCase()
  if (extension === 'bin') {
    return toAbsoluteAssetUrl(BINARY_URLS[key]) ?? uri
  }

  if (extension === 'png' || extension === 'jpg' || extension === 'jpeg' || extension === 'webp') {
    return toAbsoluteAssetUrl(TEXTURE_URLS[key] ?? THUMBNAIL_URLS[key]) ?? uri
  }

  return uri
}

function isExternalUri(uri: string) {
  return (
    uri.startsWith('data:') ||
    uri.startsWith('blob:') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://')
  )
}

function encodeBase64(value: string) {
  const bufferCtor = (
    globalThis as {
      Buffer?: {
        from: (input: string, encoding: 'utf-8') => { toString: (encoding: 'base64') => string }
      }
    }
  ).Buffer

  if (bufferCtor) {
    return bufferCtor.from(value, 'utf-8').toString('base64')
  }

  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function toAbsoluteAssetUrl(url: string | undefined) {
  if (!url) {
    return undefined
  }

  if (isExternalUri(url)) {
    return url
  }

  if (!url.startsWith('/')) {
    return url
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(url, window.location.origin).href
  }

  return url
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
