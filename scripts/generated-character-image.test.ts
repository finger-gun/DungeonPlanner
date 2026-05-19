import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleGeneratedCharacterImageRequest } from '../server/src/generatedCharacterImage'

describe('handleGeneratedCharacterImageRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses newline-delimited Ollama payloads and returns the generated image', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response([
      JSON.stringify({
        model: 'x/z-image-turbo',
        response: '',
        done: false,
        completed: 1,
        total: 2,
      }),
      JSON.stringify({
        model: 'x/z-image-turbo',
        images: ['abc123'],
        done: true,
      }),
    ].join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson',
      },
    })))

    await expect(handleGeneratedCharacterImageRequest({
      prompt: 'wizard',
      model: 'x/z-image-turbo',
    })).resolves.toEqual({
      model: 'x/z-image-turbo',
      imageDataUrl: 'data:image/png;base64,abc123',
    })
  })

  it('surfaces a clear compatibility error when Ollama returns an empty success body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })))

    await expect(handleGeneratedCharacterImageRequest({
      prompt: 'wizard',
      model: 'x/z-image-turbo',
    })).rejects.toThrow(
      'Reached Ollama, but it did not return a usable image payload for x/z-image-turbo.',
    )
  })

  it('surfaces a clear compatibility error when Ollama only reports progress', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response([
      JSON.stringify({
        model: 'x/z-image-turbo',
        response: '',
        done: false,
        total: 9,
      }),
      JSON.stringify({
        model: 'x/z-image-turbo',
        response: '',
        done: false,
        completed: 9,
        total: 9,
      }),
    ].join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson',
      },
    })))

    await expect(handleGeneratedCharacterImageRequest({
      prompt: 'wizard',
      model: 'x/z-image-turbo',
    })).rejects.toThrow(
      'Reached Ollama, but it did not return a usable image payload for x/z-image-turbo.',
    )
  })

  it('normalizes Ollama EOF errors into a clear compatibility message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: 'Post "http://127.0.0.1:58236/completion": EOF',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })))

    await expect(handleGeneratedCharacterImageRequest({
      prompt: 'wizard',
      model: 'x/z-image-turbo',
    })).rejects.toThrow(
      'Reached Ollama, but it did not return a usable image payload for x/z-image-turbo.',
    )
  })
})
