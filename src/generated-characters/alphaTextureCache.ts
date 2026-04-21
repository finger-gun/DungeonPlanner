import * as THREE from 'three'

type CanvasImageSourceWithDimensions = CanvasImageSource & {
  naturalWidth?: number
  naturalHeight?: number
  videoWidth?: number
  videoHeight?: number
  width?: number
  height?: number
}

type AlphaTextureCacheEntry = {
  texture: THREE.CanvasTexture
  refCount: number
  disposeRafId: number | null
  disposeTimeoutId: number | null
}

const alphaTextureCache = new Map<string, AlphaTextureCacheEntry>()

export function acquireGeneratedCharacterAlphaTexture(cacheKey: string, sourceTexture: THREE.Texture) {
  const existingEntry = alphaTextureCache.get(cacheKey)
  if (existingEntry) {
    cancelScheduledDispose(existingEntry)
    existingEntry.refCount += 1
    return existingEntry.texture
  }

  const source = sourceTexture.image
  if (!source || typeof source !== 'object' || typeof document === 'undefined') {
    return null
  }

  const { width, height } = getImageSourceDimensions(source as CanvasImageSourceWithDimensions)
  if (width <= 0 || height <= 0) {
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    return null
  }

  context.drawImage(source as CanvasImageSource, 0, 0, width, height)
  const imageData = context.getImageData(0, 0, width, height)
  const { data } = imageData
  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3]
    data[index] = alpha
    data[index + 1] = alpha
    data[index + 2] = alpha
    data[index + 3] = 255
  }
  context.putImageData(imageData, 0, 0)

  const alphaTexture = new THREE.CanvasTexture(canvas)
  alphaTexture.name = `generated-character-alpha:${cacheKey}`
  alphaTexture.wrapS = THREE.ClampToEdgeWrapping
  alphaTexture.wrapT = THREE.ClampToEdgeWrapping
  alphaTexture.flipY = sourceTexture.flipY
  alphaTexture.minFilter = sourceTexture.minFilter
  alphaTexture.magFilter = sourceTexture.magFilter
  alphaTexture.colorSpace = THREE.NoColorSpace
  alphaTexture.needsUpdate = true

  alphaTextureCache.set(cacheKey, {
    texture: alphaTexture,
    refCount: 1,
    disposeRafId: null,
    disposeTimeoutId: null,
  })

  return alphaTexture
}

export function releaseGeneratedCharacterAlphaTexture(cacheKey: string) {
  const entry = alphaTextureCache.get(cacheKey)
  if (!entry) {
    return
  }

  entry.refCount = Math.max(0, entry.refCount - 1)
  if (entry.refCount > 0) {
    return
  }

  scheduleDispose(cacheKey, entry)
}

export function resetGeneratedCharacterAlphaTextureCacheForTests() {
  alphaTextureCache.forEach((entry) => {
    cancelScheduledDispose(entry)
    entry.texture.dispose()
  })
  alphaTextureCache.clear()
}

function getImageSourceDimensions(source: CanvasImageSourceWithDimensions) {
  return {
    width: typeof source.naturalWidth === 'number'
      ? source.naturalWidth
      : typeof source.videoWidth === 'number'
        ? source.videoWidth
        : typeof source.width === 'number'
          ? source.width
          : 0,
    height: typeof source.naturalHeight === 'number'
      ? source.naturalHeight
      : typeof source.videoHeight === 'number'
        ? source.videoHeight
        : typeof source.height === 'number'
          ? source.height
          : 0,
  }
}

function scheduleDispose(cacheKey: string, entry: AlphaTextureCacheEntry) {
  const dispose = () => {
    entry.disposeRafId = null
    entry.disposeTimeoutId = null

    const currentEntry = alphaTextureCache.get(cacheKey)
    if (currentEntry !== entry || entry.refCount > 0) {
      return
    }

    entry.texture.dispose()
    alphaTextureCache.delete(cacheKey)
  }

  if (typeof requestAnimationFrame === 'function' && typeof cancelAnimationFrame === 'function') {
    entry.disposeRafId = requestAnimationFrame(() => {
      entry.disposeRafId = requestAnimationFrame(dispose)
    })
    return
  }

  entry.disposeTimeoutId = window.setTimeout(dispose, 32)
}

function cancelScheduledDispose(entry: AlphaTextureCacheEntry) {
  if (entry.disposeRafId !== null && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(entry.disposeRafId)
  }
  if (entry.disposeTimeoutId !== null) {
    window.clearTimeout(entry.disposeTimeoutId)
  }
  entry.disposeRafId = null
  entry.disposeTimeoutId = null
}
