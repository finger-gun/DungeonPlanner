import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import {
  createGeneratedCharacterStandeeGeometry,
  extractGeneratedStandeeContour,
  MAX_GENERATED_STANDEE_CONTOUR_VERTICES,
  resetGeneratedCharacterStandeeGeometryCacheForTests,
  simplifyGeneratedStandeeContour,
  smoothGeneratedStandeeContour,
} from './generatedStandeeGeometry'

describe('generated standee geometry', () => {
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
    resetGeneratedCharacterStandeeGeometryCacheForTests()
    vi.restoreAllMocks()
  })

  it('extracts a dominant contour from a filled rectangle mask', () => {
    const alphaPixels = createMaskPixels(16, 12, (x, y) => x >= 3 && x <= 12 && y >= 2 && y <= 9)
    const contour = extractGeneratedStandeeContour(alphaPixels, 16, 12)

    expect(contour).toHaveLength(4)
    expect(new Set(contour?.map((point) => point.join(',')))).toEqual(new Set([
      '3,2',
      '13,2',
      '13,10',
      '3,10',
    ]))
  })

  it('extracts a contour from persisted grayscale alpha-mask images', () => {
    const alphaPixels = createMaskPixels(
      18,
      14,
      (x, y) => x >= 4 && x <= 11 && y >= 3 && y <= 10,
      { grayscaleOnly: true },
    )

    const contour = extractGeneratedStandeeContour(alphaPixels, 18, 14)

    expect(contour).toHaveLength(4)
    expect(new Set(contour?.map((point) => point.join(',')))).toEqual(new Set([
      '4,3',
      '12,3',
      '12,11',
      '4,11',
    ]))
  })

  it('keeps silhouette detail while capping contour complexity', () => {
    const rawPoints = Array.from({ length: 240 }, (_, index) => {
      const angle = (index / 240) * Math.PI * 2
      const radius = index % 2 === 0 ? 1 : 0.72
      return new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius)
    })

    const simplified = simplifyGeneratedStandeeContour(rawPoints, MAX_GENERATED_STANDEE_CONTOUR_VERTICES)

    expect(simplified.length).toBeLessThanOrEqual(MAX_GENERATED_STANDEE_CONTOUR_VERTICES)
    expect(simplified.length).toBeGreaterThan(24)
  })

  it('smooths stair-step contours into diagonal segments before extrusion', () => {
    const staircase = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(5, 0),
      new THREE.Vector2(5, 1),
      new THREE.Vector2(4, 1),
      new THREE.Vector2(4, 2),
      new THREE.Vector2(3, 2),
      new THREE.Vector2(3, 3),
      new THREE.Vector2(2, 3),
      new THREE.Vector2(2, 4),
      new THREE.Vector2(1, 4),
      new THREE.Vector2(1, 5),
      new THREE.Vector2(0, 5),
    ]

    const smoothed = smoothGeneratedStandeeContour(staircase, MAX_GENERATED_STANDEE_CONTOUR_VERTICES)

    expect(smoothed.length).toBeGreaterThan(staircase.length)
    expect(hasDiagonalSegment(smoothed)).toBe(true)
  })

  it('builds an extruded silhouette geometry with bounded vertex count', () => {
    const alphaPixels = createMaskPixels(96, 128, (x, y) => {
      const normalizedX = (x / 95) * 2 - 1
      const normalizedY = (y / 127) * 2 - 1
      return (normalizedX * normalizedX) + (normalizedY * normalizedY * 0.55) < 0.74
    })
    const texture = new THREE.Texture({
      width: 96,
      height: 128,
      __alphaPixels: alphaPixels,
    } as unknown as CanvasImageSource)
    texture.needsUpdate = true

    const geometry = createGeneratedCharacterStandeeGeometry(texture, 0.95, 1.85, 0.056)
    const positionCount = geometry.getAttribute('position').count

    expect(positionCount).toBeGreaterThan(100)
    expect(positionCount).toBeLessThan(5000)
  })

  it('expands the silhouette geometry slightly beyond the raw mask cutout', () => {
    const alphaPixels = createMaskPixels(16, 12, (x, y) => x >= 3 && x <= 12 && y >= 2 && y <= 9)
    const texture = new THREE.Texture({
      width: 16,
      height: 12,
      __alphaPixels: alphaPixels,
    } as unknown as CanvasImageSource)
    texture.needsUpdate = true

    const geometry = createGeneratedCharacterStandeeGeometry(texture, 1.6, 1.2, 0.056)
    geometry.computeBoundingBox()

    const width = (geometry.boundingBox?.max.x ?? 0) - (geometry.boundingBox?.min.x ?? 0)
    const height = (geometry.boundingBox?.max.y ?? 0) - (geometry.boundingBox?.min.y ?? 0)

    expect(width).toBeGreaterThan(1)
    expect(height).toBeGreaterThan(0.8)
  })
})

function createMaskPixels(
  width: number,
  height: number,
  fill: (x: number, y: number) => boolean,
  options?: { grayscaleOnly?: boolean },
) {
  const alphaPixels = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = ((y * width) + x) * 4
      const coverage = fill(x, y) ? 255 : 0
      alphaPixels[index] = coverage
      alphaPixels[index + 1] = coverage
      alphaPixels[index + 2] = coverage
      alphaPixels[index + 3] = options?.grayscaleOnly ? 255 : coverage
    }
  }
  return alphaPixels
}

function createMockCanvas() {
  let source: { __alphaPixels?: Uint8ClampedArray; width?: number; height?: number } | null = null
  return {
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage: (image: { __alphaPixels?: Uint8ClampedArray; width?: number; height?: number }) => {
        source = image
      },
      getImageData: () => ({
        data: source?.__alphaPixels ?? new Uint8ClampedArray(),
      }),
    }),
  }
}

function hasDiagonalSegment(points: THREE.Vector2[]) {
  return points.some((point, index) => {
    const next = points[(index + 1) % points.length]
    if (!next) {
      return false
    }
    return Math.abs(next.x - point.x) > 1e-4 && Math.abs(next.y - point.y) > 1e-4
  })
}
