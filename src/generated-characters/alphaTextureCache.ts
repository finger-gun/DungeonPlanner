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
  lastUsedAt: number
}

const alphaTextureCache = new Map<string, AlphaTextureCacheEntry>()
const MAX_LEGACY_ALPHA_TEXTURES = 24
let accessCounter = 0

export function acquireGeneratedCharacterAlphaTexture(cacheKey: string, sourceTexture: THREE.Texture) {
  const existingEntry = alphaTextureCache.get(cacheKey)
  if (existingEntry) {
    existingEntry.refCount += 1
    existingEntry.lastUsedAt = ++accessCounter
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
    lastUsedAt: ++accessCounter,
  })
  pruneLegacyGeneratedCharacterAlphaTextures()

  return alphaTexture
}

export function releaseGeneratedCharacterAlphaTexture(cacheKey: string) {
  const entry = alphaTextureCache.get(cacheKey)
  if (!entry) {
    return
  }

  entry.refCount = Math.max(0, entry.refCount - 1)
  entry.lastUsedAt = ++accessCounter
  pruneLegacyGeneratedCharacterAlphaTextures()
}

export function resetGeneratedCharacterAlphaTextureCacheForTests() {
  alphaTextureCache.forEach((entry) => {
    entry.texture.dispose()
  })
  alphaTextureCache.clear()
  accessCounter = 0
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

function pruneLegacyGeneratedCharacterAlphaTextures() {
  if (alphaTextureCache.size <= MAX_LEGACY_ALPHA_TEXTURES) {
    return
  }

  const candidates = [...alphaTextureCache.entries()]
    .filter(([, entry]) => entry.refCount === 0)
    .sort((left, right) => left[1].lastUsedAt - right[1].lastUsedAt)

  for (const [cacheKey, entry] of candidates) {
    if (alphaTextureCache.size <= MAX_LEGACY_ALPHA_TEXTURES) {
      break
    }
    entry.texture.dispose()
    alphaTextureCache.delete(cacheKey)
  }
}
