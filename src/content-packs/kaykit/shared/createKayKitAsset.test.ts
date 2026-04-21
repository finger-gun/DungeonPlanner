import { describe, expect, it } from 'vitest'
import { resolveKayKitModelAssetUrl } from './createKayKitAsset'

describe('createKayKitAsset gltf resolution', () => {
  it('rewrites external .bin and texture references for gltf assets', () => {
    const url = resolveKayKitModelAssetUrl('Tree_1_A_Color1')
    expect(url).toBeTruthy()
    expect(url?.startsWith('data:model/gltf+json;base64,')).toBe(true)

    const payload = url?.split('base64,')[1]
    expect(payload).toBeTruthy()
    const decoded = decodeBase64(payload ?? '')
    const gltf = JSON.parse(decoded) as {
      buffers?: Array<{ uri?: string }>
      images?: Array<{ uri?: string }>
    }

    expect(gltf.buffers?.[0]?.uri).toBeTruthy()
    expect(gltf.images?.[0]?.uri).toBeTruthy()
    expect(gltf.buffers?.[0]?.uri).not.toBe('Tree_1_A_Color1.bin')
    expect(gltf.images?.[0]?.uri).not.toBe('forest_texture.png')
    expect(gltf.buffers?.[0]?.uri?.startsWith('data:model/')).toBe(false)
    expect(gltf.buffers?.[0]?.uri?.startsWith('http')).toBe(true)
    expect(gltf.images?.[0]?.uri?.startsWith('http')).toBe(true)
  })
})

function decodeBase64(value: string) {
  const bufferCtor = (
    globalThis as {
      Buffer?: {
        from: (input: string, encoding: 'base64') => { toString: (encoding: 'utf-8') => string }
      }
    }
  ).Buffer

  if (bufferCtor) {
    return bufferCtor.from(value, 'base64').toString('utf-8')
  }

  const binary = atob(value)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
