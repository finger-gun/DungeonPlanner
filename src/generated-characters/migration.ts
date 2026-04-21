import {
  deleteGeneratedCharacterAssets,
  saveGeneratedCharacterAssets,
} from './api'
import { deriveGeneratedCharacterAlphaMaskDataUrl } from './processing'
import {
  isGeneratedCharacterReady,
  type GeneratedCharacterRecord,
  type UpdateGeneratedCharacterInput,
} from './types'

type SaveGeneratedCharacterAssetsFn = typeof saveGeneratedCharacterAssets
type DeleteGeneratedCharacterAssetsFn = typeof deleteGeneratedCharacterAssets

type BackfillGeneratedCharacterAssetsOptions = {
  fetchImpl?: typeof fetch
  saveAssets?: SaveGeneratedCharacterAssetsFn
  loadAssetAsDataUrl?: typeof loadGeneratedCharacterAssetAsDataUrl
  deriveAlphaMaskDataUrl?: typeof deriveGeneratedCharacterAlphaMaskDataUrl
}

type MigrateLegacyGeneratedCharactersOptions = BackfillGeneratedCharacterAssetsOptions & {
  deleteAssets?: DeleteGeneratedCharacterAssetsFn
  getCharacters: () => Record<string, GeneratedCharacterRecord>
  updateCharacter: (assetId: string, input: UpdateGeneratedCharacterInput) => boolean
  reportError?: (assetId: string, error: unknown) => void
}

const migratingGeneratedCharacterAssetIds = new Set<string>()

export function needsGeneratedCharacterAlphaMaskMigration(character: GeneratedCharacterRecord) {
  return isGeneratedCharacterReady(character) && !character.alphaMaskUrl
}

export async function backfillGeneratedCharacterAssets(
  character: GeneratedCharacterRecord,
  options: BackfillGeneratedCharacterAssetsOptions = {},
) {
  if (!needsGeneratedCharacterAlphaMaskMigration(character)) {
    return null
  }

  const loadAssetAsDataUrl = options.loadAssetAsDataUrl ?? loadGeneratedCharacterAssetAsDataUrl
  const deriveAlphaMaskDataUrl = options.deriveAlphaMaskDataUrl ?? deriveGeneratedCharacterAlphaMaskDataUrl
  const saveAssets = options.saveAssets ?? saveGeneratedCharacterAssets
  const processedImageDataUrl = await loadAssetAsDataUrl(character.processedImageUrl!, options.fetchImpl)
  const [originalImageDataUrl, thumbnailDataUrl, alphaMaskDataUrl] = await Promise.all([
    loadAssetAsDataUrl(character.originalImageUrl ?? character.processedImageUrl!, options.fetchImpl),
    loadAssetAsDataUrl(character.thumbnailUrl!, options.fetchImpl),
    deriveAlphaMaskDataUrl(processedImageDataUrl),
  ])

  return saveAssets({
    originalImageDataUrl,
    processedImageDataUrl,
    alphaMaskDataUrl,
    thumbnailDataUrl,
  }, options.fetchImpl)
}

export async function migrateLegacyGeneratedCharacters(options: MigrateLegacyGeneratedCharactersOptions) {
  const reportError = options.reportError ?? defaultGeneratedCharacterMigrationErrorReporter
  const saveAssets = options.saveAssets ?? saveGeneratedCharacterAssets
  const deleteAssets = options.deleteAssets ?? deleteGeneratedCharacterAssets

  const candidates = Object.values(options.getCharacters())
    .filter(needsGeneratedCharacterAlphaMaskMigration)
    .filter((character) => !migratingGeneratedCharacterAssetIds.has(character.assetId))

  for (const character of candidates) {
    migratingGeneratedCharacterAssetIds.add(character.assetId)

    try {
      const migratedAssets = await backfillGeneratedCharacterAssets(character, {
        fetchImpl: options.fetchImpl,
        saveAssets,
        loadAssetAsDataUrl: options.loadAssetAsDataUrl,
        deriveAlphaMaskDataUrl: options.deriveAlphaMaskDataUrl,
      })
      if (!migratedAssets) {
        continue
      }

      const latestCharacter = options.getCharacters()[character.assetId]
      const canApplyMigration = latestCharacter
        && needsGeneratedCharacterAlphaMaskMigration(latestCharacter)
        && latestCharacter.storageId === character.storageId
        && latestCharacter.processedImageUrl === character.processedImageUrl

      if (!canApplyMigration) {
        if (migratedAssets.storageId !== character.storageId) {
          await deleteAssets(migratedAssets.storageId, options.fetchImpl)
        }
        continue
      }

      options.updateCharacter(character.assetId, {
        storageId: migratedAssets.storageId,
        originalImageUrl: migratedAssets.originalImageUrl,
        processedImageUrl: migratedAssets.processedImageUrl,
        alphaMaskUrl: migratedAssets.alphaMaskUrl,
        thumbnailUrl: migratedAssets.thumbnailUrl,
      })

      if (character.storageId && character.storageId !== migratedAssets.storageId) {
        await deleteAssets(character.storageId, options.fetchImpl)
      }
    } catch (error) {
      reportError(character.assetId, error)
    } finally {
      migratingGeneratedCharacterAssetIds.delete(character.assetId)
    }
  }
}

export async function loadGeneratedCharacterAssetAsDataUrl(source: string, fetchImpl: typeof fetch = fetch) {
  if (source.startsWith('data:')) {
    return source
  }

  const response = await fetchImpl(source)
  if (!response.ok) {
    throw new Error(`Could not read generated character asset from ${source}.`)
  }

  return blobToDataUrl(await response.blob())
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Could not convert generated character asset into a data URL.'))
    }
    reader.onerror = () => reject(new Error('Could not convert generated character asset into a data URL.'))
    reader.readAsDataURL(blob)
  })
}

function defaultGeneratedCharacterMigrationErrorReporter(assetId: string, error: unknown) {
  console.error(
    `Could not backfill alpha mask assets for generated character ${assetId}.`,
    error,
  )
}
