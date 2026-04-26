const MODEL_URLS = import.meta.glob('../../../assets/models/forrest/**/*.glb', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>

const glbAssetUrls = Object.fromEntries(
  Object.entries(MODEL_URLS).map(([key, url]) => [getAssetName(key), url]),
) as Record<string, string>

export function resolveKayKitModelAssetUrl(name: string) {
  return glbAssetUrls[name]
}

export function listAvailableKayKitModelNames() {
  return Object.keys(glbAssetUrls).sort((left, right) => left.localeCompare(right))
}

function getAssetName(key: string) {
  return key
    .split('/')
    .pop()
    ?.replace(/\.glb$/i, '') ?? key
}
