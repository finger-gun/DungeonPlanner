import { describe, expect, it, vi } from 'vitest'
import {
  backfillGeneratedCharacterAssets,
  loadGeneratedCharacterAssetAsDataUrl,
  migrateLegacyGeneratedCharacters,
  needsGeneratedCharacterAlphaMaskMigration,
} from './migration'
import type { GeneratedCharacterRecord } from './types'

const TEST_CHARACTER: GeneratedCharacterRecord = {
  assetId: 'generated.player.test',
  storageId: 'legacy-storage',
  name: 'Legacy Hero',
  kind: 'player',
  prompt: 'hero',
  model: 'x/z-image-turbo',
  size: 'M',
  originalImageUrl: '/generated-character-assets/legacy-storage/original.png',
  processedImageUrl: '/generated-character-assets/legacy-storage/processed.png',
  alphaMaskUrl: null,
  thumbnailUrl: '/generated-character-assets/legacy-storage/thumbnail.png',
  width: 256,
  height: 512,
  createdAt: '2026-04-17T00:00:00.000Z',
  updatedAt: '2026-04-17T00:00:00.000Z',
}

describe('generated character migration', () => {
  it('detects ready characters that still need alpha-mask backfill', () => {
    expect(needsGeneratedCharacterAlphaMaskMigration(TEST_CHARACTER)).toBe(true)
    expect(needsGeneratedCharacterAlphaMaskMigration({
      ...TEST_CHARACTER,
      alphaMaskUrl: '/generated-character-assets/legacy-storage/alpha-mask.png',
    })).toBe(false)
    expect(needsGeneratedCharacterAlphaMaskMigration({
      ...TEST_CHARACTER,
      thumbnailUrl: null,
    })).toBe(false)
  })

  it('loads non-data generated character assets through fetch and returns a data URL', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(
      'alpha',
      {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
        },
      },
    ))

    await expect(
      loadGeneratedCharacterAssetAsDataUrl('/generated-character-assets/legacy-storage/processed.png', fetchImpl),
    ).resolves.toMatch(/^data:/)
  })

  it('backfills legacy character assets with a generated alpha-mask', async () => {
    const loadAssetAsDataUrl = vi.fn()
      .mockResolvedValueOnce('data:image/png;base64,processed')
      .mockResolvedValueOnce('data:image/png;base64,original')
      .mockResolvedValueOnce('data:image/png;base64,thumbnail')
    const deriveAlphaMaskDataUrl = vi.fn().mockResolvedValue('data:image/png;base64,alpha')
    const saveAssets = vi.fn().mockResolvedValue({
      storageId: 'migrated-storage',
      originalImageUrl: '/generated-character-assets/migrated-storage/original.png',
      processedImageUrl: '/generated-character-assets/migrated-storage/processed.png',
      alphaMaskUrl: '/generated-character-assets/migrated-storage/alpha-mask.png',
      thumbnailUrl: '/generated-character-assets/migrated-storage/thumbnail.png',
    })

    await expect(backfillGeneratedCharacterAssets(TEST_CHARACTER, {
      loadAssetAsDataUrl,
      deriveAlphaMaskDataUrl,
      saveAssets,
    })).resolves.toEqual({
      storageId: 'migrated-storage',
      originalImageUrl: '/generated-character-assets/migrated-storage/original.png',
      processedImageUrl: '/generated-character-assets/migrated-storage/processed.png',
      alphaMaskUrl: '/generated-character-assets/migrated-storage/alpha-mask.png',
      thumbnailUrl: '/generated-character-assets/migrated-storage/thumbnail.png',
    })

    expect(loadAssetAsDataUrl).toHaveBeenNthCalledWith(1, TEST_CHARACTER.processedImageUrl, undefined)
    expect(loadAssetAsDataUrl).toHaveBeenNthCalledWith(2, TEST_CHARACTER.originalImageUrl, undefined)
    expect(loadAssetAsDataUrl).toHaveBeenNthCalledWith(3, TEST_CHARACTER.thumbnailUrl, undefined)
    expect(deriveAlphaMaskDataUrl).toHaveBeenCalledWith('data:image/png;base64,processed')
  })

  it('updates and cleans up legacy characters after migrating them', async () => {
    const getCharacters = vi.fn(() => ({
      [TEST_CHARACTER.assetId]: TEST_CHARACTER,
    }))
    const updateCharacter = vi.fn(() => true)
    const saveAssets = vi.fn().mockResolvedValue({
      storageId: 'migrated-storage',
      originalImageUrl: '/generated-character-assets/migrated-storage/original.png',
      processedImageUrl: '/generated-character-assets/migrated-storage/processed.png',
      alphaMaskUrl: '/generated-character-assets/migrated-storage/alpha-mask.png',
      thumbnailUrl: '/generated-character-assets/migrated-storage/thumbnail.png',
    })
    const deleteAssets = vi.fn().mockResolvedValue(undefined)

    await migrateLegacyGeneratedCharacters({
      getCharacters,
      updateCharacter,
      saveAssets,
      deleteAssets,
      loadAssetAsDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,asset'),
      deriveAlphaMaskDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,alpha'),
    })

    expect(updateCharacter).toHaveBeenCalledWith(TEST_CHARACTER.assetId, {
      storageId: 'migrated-storage',
      originalImageUrl: '/generated-character-assets/migrated-storage/original.png',
      processedImageUrl: '/generated-character-assets/migrated-storage/processed.png',
      alphaMaskUrl: '/generated-character-assets/migrated-storage/alpha-mask.png',
      thumbnailUrl: '/generated-character-assets/migrated-storage/thumbnail.png',
    })
    expect(deleteAssets).toHaveBeenCalledWith('legacy-storage', undefined)
  })
})
