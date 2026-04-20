import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import {
  acquireGeneratedCharacterAlphaTexture,
  releaseGeneratedCharacterAlphaTexture,
  resetGeneratedCharacterAlphaTextureCacheForTests,
} from './alphaTextureCache'

let rafCallbacks: Array<FrameRequestCallback | null> = []

describe('generated character alpha texture cache', () => {
  const originalCreateElement = document.createElement.bind(document)

  beforeEach(() => {
    rafCallbacks = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      rafCallbacks.push(callback)
      return rafCallbacks.length - 1
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafCallbacks[id] = null
    })
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'canvas') {
        return createMockCanvas() as unknown as HTMLElement
      }
      return originalCreateElement(tagName)
    }) as typeof document.createElement)
  })

  afterEach(() => {
    resetGeneratedCharacterAlphaTextureCacheForTests()
    vi.unstubAllGlobals()
  })

  it('reuses the same alpha texture for repeated mounts of the same character image', () => {
    const sourceTexture = createSourceTexture()

    const first = acquireGeneratedCharacterAlphaTexture('skeleton', sourceTexture)
    const second = acquireGeneratedCharacterAlphaTexture('skeleton', sourceTexture)

    expect(first).toBeInstanceOf(THREE.CanvasTexture)
    expect(second).toBe(first)
  })

  it('defers disposal long enough for an immediate remount to reclaim the texture', () => {
    const sourceTexture = createSourceTexture()
    const alphaTexture = acquireGeneratedCharacterAlphaTexture('skeleton', sourceTexture)
    expect(alphaTexture).toBeInstanceOf(THREE.CanvasTexture)

    const disposeSpy = vi.spyOn(alphaTexture!, 'dispose')

    releaseGeneratedCharacterAlphaTexture('skeleton')
    expect(disposeSpy).not.toHaveBeenCalled()

    flushNextAnimationFrame()
    const reacquired = acquireGeneratedCharacterAlphaTexture('skeleton', sourceTexture)
    expect(reacquired).toBe(alphaTexture)

    flushAllAnimationFrames()
    expect(disposeSpy).not.toHaveBeenCalled()

    releaseGeneratedCharacterAlphaTexture('skeleton')
    flushAllAnimationFrames()
    expect(disposeSpy).toHaveBeenCalledTimes(1)
  })
})

function createSourceTexture() {
  const texture = new THREE.Texture({ width: 4, height: 8 } as CanvasImageSource)
  texture.needsUpdate = true
  return texture
}

function flushNextAnimationFrame() {
  const callback = rafCallbacks.shift()
  callback?.(performance.now())
}

function flushAllAnimationFrames() {
  while (rafCallbacks.length > 0) {
    flushNextAnimationFrame()
  }
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
