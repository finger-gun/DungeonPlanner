const MODEL_URLS = import.meta.glob('../../../assets/models/kaykit/*.glb', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>

const GLTF_SOURCES = import.meta.glob('../../../assets/models/kaykit/*.gltf', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>

const BIN_URLS = import.meta.glob('../../../assets/models/kaykit/*.bin', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>

const IMAGE_URLS = import.meta.glob([
  '../../../assets/models/kaykit/*.png',
  '../../../assets/models/kaykit/*.jpg',
  '../../../assets/models/kaykit/*.jpeg',
  '../../../assets/models/kaykit/*.webp',
], {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>

type GltfDocument = {
  buffers?: Array<{ uri?: string }>
  images?: Array<{ uri?: string }>
}

const REWRITTEN_GLTF_URLS = Object.fromEntries(
  Object.entries(GLTF_SOURCES).map(([key, source]) => [key, rewriteGltfAssetSource(source)]),
) as Record<string, string>

export function resolveKayKitAssetUrl(name: string, extension: 'glb' | 'gltf') {
  const key = `../../../assets/models/kaykit/${name}.${extension}`
  return extension === 'glb' ? MODEL_URLS[key] : REWRITTEN_GLTF_URLS[key]
}

export function resolveKayKitModelAssetUrl(name: string) {
  return resolveKayKitAssetUrl(name, 'glb') ?? resolveKayKitAssetUrl(name, 'gltf')
}

function rewriteGltfAssetSource(source: string) {
  const document = JSON.parse(source) as GltfDocument

  document.buffers?.forEach((buffer) => {
    if (!buffer.uri || !isLocalUri(buffer.uri)) {
      return
    }

    buffer.uri = resolveKayKitSidecarUrl(buffer.uri) ?? buffer.uri
  })

  document.images?.forEach((image) => {
    if (!image.uri || !isLocalUri(image.uri)) {
      return
    }

    image.uri = resolveKayKitSidecarUrl(image.uri) ?? image.uri
  })

  return `data:model/gltf+json;base64,${btoa(JSON.stringify(document))}`
}

function resolveKayKitSidecarUrl(uri: string) {
  const normalizedPath = uri.split(/[?#]/, 1)[0]
  const binKey = `../../../assets/models/kaykit/${normalizedPath}`
  if (BIN_URLS[binKey]) {
    return absolutizeRuntimeUrl(BIN_URLS[binKey])
  }

  if (IMAGE_URLS[binKey]) {
    return absolutizeRuntimeUrl(IMAGE_URLS[binKey])
  }

  return undefined
}

function isLocalUri(uri: string) {
  return !/^(?:[a-z]+:)?\/\//i.test(uri) && !uri.startsWith('data:')
}

function absolutizeRuntimeUrl(url: string) {
  if (/^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }

  if (typeof window !== 'undefined' && window.location) {
    return new URL(url, window.location.href).toString()
  }

  if (typeof location !== 'undefined') {
    return new URL(url, location.href).toString()
  }

  return url
}
