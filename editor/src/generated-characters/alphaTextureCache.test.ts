import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import {
  acquireGeneratedCharacterAlphaTexture,
  releaseGeneratedCharacterAlphaTexture,
  resetGeneratedCharacterAlphaTextureCacheForTests,
} from './alphaTextureCache'

describe('generated character alpha texture cache', () => {
  const originalCreateElement = document.createElement.bind(document)

  beforeEach(() => {
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'canvas') {
        return createMockCanvas() as unknown as HTMLElement
      }
      return originalCreateElement(tagName)
    }) as typeof document.createElement)
  })

  afterEach(() => {
    resetGeneratedCharacterAlphaTextureCacheForTests()
  })

  it('reuses the same alpha texture for repeated mounts of the same character image', () => {
    const sourceTexture = createSourceTexture()

    const first = acquireGeneratedCharacterAlphaTexture('skeleton', sourceTexture)
    const second = acquireGeneratedCharacterAlphaTexture('skeleton', sourceTexture)

    expect(first).toBeInstanceOf(THREE.CanvasTexture)
    expect(second).toBe(first)
  })

  it('keeps released legacy textures cached until the test cache is reset', () => {
    const sourceTexture = createSourceTexture()
    const alphaTexture = acquireGeneratedCharacterAlphaTexture('skeleton', sourceTexture)
    expect(alphaTexture).toBeInstanceOf(THREE.CanvasTexture)

    const disposeSpy = vi.spyOn(alphaTexture!, 'dispose')

    releaseGeneratedCharacterAlphaTexture('skeleton')
    const reacquired = acquireGeneratedCharacterAlphaTexture('skeleton', sourceTexture)
    expect(reacquired).toBe(alphaTexture)

    expect(disposeSpy).not.toHaveBeenCalled()
  })
})

function createSourceTexture() {
  const texture = new THREE.Texture({ width: 4, height: 8 } as CanvasImageSource)
  texture.needsUpdate = true
  return texture
}

function createMockCanvas() {
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      clearRect: () => {},
      fillRect: () => {},
      drawImage: () => {},
      putImageData: () => {},
      getImageData: () => ({
        data: new Uint8ClampedArray(Math.max(1, canvas.width * canvas.height * 4)),
      }),
    }),
  }

  return canvas
}
