import { describe, expect, it, vi } from 'vitest'
import {
  listGeneratedCharacterModels,
  deleteGeneratedCharacterAssets,
  requestGeneratedCharacterImage,
  saveGeneratedCharacterAssets,
  STORAGE_UNAVAILABLE_MESSAGE,
  UNAVAILABLE_MESSAGE,
} from './api'

describe('requestGeneratedCharacterImage', () => {
  it('returns the generated image payload when the response is valid JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        imageDataUrl: 'data:image/png;base64,abc',
        model: 'x/z-image-turbo',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    )

    await expect(requestGeneratedCharacterImage('wizard', { fetchImpl })).resolves.toEqual({
      imageDataUrl: 'data:image/png;base64,abc',
      model: 'x/z-image-turbo',
    })
  })

  it('surfaces a friendly message when the request cannot reach the backend', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(requestGeneratedCharacterImage('wizard', { fetchImpl })).rejects.toThrow(UNAVAILABLE_MESSAGE)
  })

  it('falls back to a friendly message for non-JSON proxy failures', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response('<html><body>Bad Gateway</body></html>', {
        status: 502,
        statusText: 'Bad Gateway',
        headers: {
          'Content-Type': 'text/html',
        },
      }),
    )

    await expect(requestGeneratedCharacterImage('wizard', { fetchImpl })).rejects.toThrow(UNAVAILABLE_MESSAGE)
  })

  it('passes an explicitly selected model to the backend', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        imageDataUrl: 'data:image/png;base64,abc',
        model: 'x/flux2-klein:9b',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    )

    await requestGeneratedCharacterImage('wizard', {
      model: 'x/flux2-klein:9b',
      fetchImpl,
    })

    expect(fetchImpl).toHaveBeenCalledWith('/api/generated-characters/image', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        prompt: 'wizard',
        model: 'x/flux2-klein:9b',
      }),
    }))
  })

  it('saves generated assets to disk through the backend', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        storageId: 'storage-test',
        originalImageUrl: '/generated-character-assets/storage-test/original.png',
        processedImageUrl: '/generated-character-assets/storage-test/processed.png',
        thumbnailUrl: '/generated-character-assets/storage-test/thumbnail.png',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    )

    await expect(saveGeneratedCharacterAssets({
      originalImageDataUrl: 'data:image/png;base64,abc',
      processedImageDataUrl: 'data:image/png;base64,def',
      thumbnailDataUrl: 'data:image/png;base64,ghi',
    }, fetchImpl)).resolves.toEqual({
      storageId: 'storage-test',
      originalImageUrl: '/generated-character-assets/storage-test/original.png',
      processedImageUrl: '/generated-character-assets/storage-test/processed.png',
      thumbnailUrl: '/generated-character-assets/storage-test/thumbnail.png',
    })
  })

  it('surfaces a friendly storage error when the backend is unavailable', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(saveGeneratedCharacterAssets({
      originalImageDataUrl: 'data:image/png;base64,abc',
      processedImageDataUrl: 'data:image/png;base64,def',
      thumbnailDataUrl: 'data:image/png;base64,ghi',
    }, fetchImpl)).rejects.toThrow(STORAGE_UNAVAILABLE_MESSAGE)
  })

  it('supports deleting generated assets from disk', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(null, { status: 204 }),
    )

    await expect(deleteGeneratedCharacterAssets('storage-test', fetchImpl)).resolves.toBeUndefined()
  })
})

describe('listGeneratedCharacterModels', () => {
  it('returns installed model names from the backend', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        defaultModel: 'x/z-image-turbo',
        models: ['x/z-image-turbo', 'x/flux2-klein:9b'],
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    )

    await expect(listGeneratedCharacterModels(fetchImpl)).resolves.toEqual({
      defaultModel: 'x/z-image-turbo',
      models: ['x/z-image-turbo', 'x/flux2-klein:9b'],
    })
  })
})
