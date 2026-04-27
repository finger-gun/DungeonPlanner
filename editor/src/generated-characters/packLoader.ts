import {
  normalizeGeneratedCharacterRecord,
  type GeneratedCharacterPackIndex,
  type GeneratedCharacterPackManifest,
  type GeneratedCharacterRecord,
} from '@dungeonplanner/shared/generated-characters/types'

export const GENERATED_CHARACTER_PACK_INDEX_URL = '/generated-character-packs/index.json'
const GENERATED_CHARACTER_ASSET_PREFIX = 'generated.player.'

export async function loadGeneratedCharacterPackRecords({
  fetchImpl = fetch,
  indexUrl = GENERATED_CHARACTER_PACK_INDEX_URL,
}: {
  fetchImpl?: typeof fetch
  indexUrl?: string
} = {}) {
  const manifestUrls = await loadGeneratedCharacterPackManifestUrls({ fetchImpl, indexUrl })
  const records = await Promise.all(
    manifestUrls.map((manifestUrl) => loadGeneratedCharacterPackManifestRecords({ fetchImpl, manifestUrl })),
  )

  return records.flat()
}

async function loadGeneratedCharacterPackManifestUrls({
  fetchImpl,
  indexUrl,
}: {
  fetchImpl: typeof fetch
  indexUrl: string
}) {
  const response = await fetchImpl(indexUrl)
  if (response.status === 404) {
    return []
  }
  if (!response.ok) {
    throw new Error(`Failed to load generated character pack index from ${indexUrl}: ${response.status} ${response.statusText}`)
  }

  const index = await response.json() as GeneratedCharacterPackIndex
  if (index.schemaVersion !== 1 || !Array.isArray(index.manifests)) {
    throw new Error(`Generated character pack index at ${indexUrl} is invalid.`)
  }

  const baseUrl = toAbsoluteUrl(indexUrl)
  return index.manifests.map((manifestPath) => new URL(manifestPath, baseUrl).toString())
}

async function loadGeneratedCharacterPackManifestRecords({
  fetchImpl,
  manifestUrl,
}: {
  fetchImpl: typeof fetch
  manifestUrl: string
}) {
  const response = await fetchImpl(manifestUrl)
  if (!response.ok) {
    throw new Error(`Failed to load generated character pack manifest from ${manifestUrl}: ${response.status} ${response.statusText}`)
  }

  const manifest = await response.json() as GeneratedCharacterPackManifest
  if (
    manifest.schemaVersion !== 1
    || manifest.type !== 'generated-character-pack'
    || !Array.isArray(manifest.characters)
  ) {
    throw new Error(`Generated character pack manifest at ${manifestUrl} is invalid.`)
  }

  return manifest.characters.map<GeneratedCharacterRecord>((character) => {
    const manifestBaseUrl = new URL('.', manifestUrl).toString()
    const assetId = createGeneratedCharacterAssetId(`${manifest.packId}.${character.id}`)

    return normalizeGeneratedCharacterRecord(assetId, {
      assetId,
      storageId: null,
      name: character.name,
      kind: character.kind,
      prompt: character.prompt,
      model: character.model,
      size: character.size,
      originalImageUrl: resolveOptionalManifestAssetUrl(character.originalImagePath, manifestBaseUrl),
      processedImageUrl: new URL(character.processedImagePath, manifestBaseUrl).toString(),
      alphaMaskUrl: resolveOptionalManifestAssetUrl(character.alphaMaskPath, manifestBaseUrl),
      thumbnailUrl: new URL(character.thumbnailPath, manifestBaseUrl).toString(),
      width: character.width,
      height: character.height,
      packId: manifest.packId,
      packName: manifest.name,
      packDescription: manifest.description,
      packScope: manifest.scope,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    })
  })
}

function resolveOptionalManifestAssetUrl(path: string | null, manifestBaseUrl: string) {
  return typeof path === 'string' && path.trim()
    ? new URL(path, manifestBaseUrl).toString()
    : null
}

function toAbsoluteUrl(url: string) {
  return new URL(url, window.location.origin).toString()
}

function createGeneratedCharacterAssetId(id: string) {
  return `${GENERATED_CHARACTER_ASSET_PREFIX}${id}`
}
