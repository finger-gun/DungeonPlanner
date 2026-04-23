const MODEL_URLS = import.meta.glob('../../../assets/models/kaykit/**/*.glb', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>

const GLTF_SOURCES = import.meta.glob('../../../assets/models/kaykit/**/*.gltf', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>

const SIDECAR_URLS = import.meta.glob(
  [
    '../../../assets/models/kaykit/**/*.bin',
    '../../../assets/models/kaykit/**/*.ktx2',
    '../../../assets/models/kaykit/**/*.png',
    '../../../assets/models/kaykit/**/*.jpg',
    '../../../assets/models/kaykit/**/*.jpeg',
    '../../../assets/models/kaykit/**/*.webp',
  ],
  {
    eager: true,
    import: 'default',
    query: '?url',
  },
) as Record<string, string>

type GltfDocument = {
  buffers?: Array<{ uri?: string }>
  images?: Array<{ uri?: string }>
}

const glbAssetUrls = indexAssetUrls(MODEL_URLS)
const normalizedSidecarUrls = Object.fromEntries(
  Object.entries(SIDECAR_URLS).map(([key, url]) => [normalizeAssetKey(key), url]),
) as Record<string, string>
const rewrittenGltfUrls = Object.fromEntries(
  Object.entries(GLTF_SOURCES).map(([key, source]) => [getAssetName(key), rewriteGltfAssetSource(key, source)]),
) as Record<string, string>

export function resolveKayKitAssetUrl(name: string, extension: 'glb' | 'gltf') {
  return extension === 'glb' ? glbAssetUrls[name] : rewrittenGltfUrls[name]
}

export function resolveKayKitModelAssetUrl(name: string) {
  return resolveKayKitAssetUrl(name, 'glb') ?? resolveKayKitAssetUrl(name, 'gltf')
}

function rewriteGltfAssetSource(key: string, source: string) {
  const document = JSON.parse(source) as GltfDocument
  const assetDir = getAssetDir(key)

  document.buffers?.forEach((buffer) => {
    if (!buffer.uri || !isLocalUri(buffer.uri)) {
      return
    }

    buffer.uri = resolveKayKitSidecarUrl(assetDir, buffer.uri) ?? buffer.uri
  })

  document.images?.forEach((image) => {
    if (!image.uri || !isLocalUri(image.uri)) {
      return
    }

    image.uri = resolveKayKitSidecarUrl(assetDir, image.uri) ?? image.uri
  })

  return `data:model/gltf+json;base64,${btoa(JSON.stringify(document))}`
}

function resolveKayKitSidecarUrl(assetDir: string, uri: string) {
  const normalizedPath = uri.split(/[?#]/, 1)[0]
  const sidecarKey = normalizeAssetKey(`${assetDir}/${normalizedPath}`)
  const sidecarUrl = normalizedSidecarUrls[sidecarKey]

  return sidecarUrl ? absolutizeRuntimeUrl(sidecarUrl) : undefined
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

function indexAssetUrls(assetUrls: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(assetUrls).map(([key, url]) => [getAssetName(key), url]),
  ) as Record<string, string>
}

function getAssetDir(key: string) {
  const normalizedKey = normalizeAssetKey(key)
  return normalizedKey.slice(0, normalizedKey.lastIndexOf('/'))
}

function getAssetName(key: string) {
  return key
    .split('/')
    .pop()
    ?.replace(/\.(glb|gltf)$/i, '') ?? key
}

function normalizeAssetKey(key: string) {
  const normalized = key.replace(/\\/g, '/')
  const segments = normalized.split('/')
  const resolvedSegments: string[] = []

  for (const segment of segments) {
    if (!segment || segment === '.') {
      continue
    }

    if (segment === '..') {
      resolvedSegments.pop()
      continue
    }

    resolvedSegments.push(segment)
  }

  return resolvedSegments.join('/')
}
