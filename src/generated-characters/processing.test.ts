import { describe, expect, it } from 'vitest'
import {
  buildOutlineMask,
  isGreenishBackgroundPixel,
  keepDominantSubjectComponent,
  removeGreenEdgeFringe,
  removeGreenBackgroundRegions,
} from './processing'

describe('generated character processing', () => {
  it('recognizes green-screen background colors without matching white border pixels', () => {
    expect(isGreenishBackgroundPixel(18, 160, 32)).toBe(true)
    expect(isGreenishBackgroundPixel(210, 245, 215)).toBe(true)
    expect(isGreenishBackgroundPixel(250, 250, 250)).toBe(false)
    expect(isGreenishBackgroundPixel(220, 220, 180)).toBe(false)
  })

  it('removes green background regions while preserving the white border and dark subject', () => {
    const width = 7
    const height = 7
    const mask = new Uint8ClampedArray(width * height).fill(255)
    const imageData = new Uint8ClampedArray(width * height * 4)

    const setPixel = (x: number, y: number, red: number, green: number, blue: number) => {
      const index = ((y * width) + x) * 4
      imageData[index] = red
      imageData[index + 1] = green
      imageData[index + 2] = blue
      imageData[index + 3] = 255
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        setPixel(x, y, 20, 170, 40)
      }
    }

    for (const [x, y] of [
      [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
      [1, 2], [5, 2],
      [1, 3], [3, 3], [5, 3],
      [1, 4], [5, 4],
      [1, 5], [2, 5], [3, 5], [4, 5], [5, 5],
    ]) {
      setPixel(x, y, 255, 255, 255)
    }

    setPixel(2, 2, 40, 40, 40)
    setPixel(4, 2, 40, 40, 40)
    setPixel(2, 4, 40, 40, 40)
    setPixel(4, 4, 40, 40, 40)

    setPixel(3, 2, 255, 255, 255)
    setPixel(2, 3, 255, 255, 255)
    setPixel(4, 3, 255, 255, 255)
    setPixel(3, 4, 255, 255, 255)
    setPixel(3, 3, 24, 190, 48)

    removeGreenBackgroundRegions(mask, imageData, width, height, 18)

    expect(mask[0]).toBe(0)
    expect(mask[(1 * width) + 1]).toBe(255)
    expect(mask[(2 * width) + 2]).toBe(255)
    expect(mask[(3 * width) + 3]).toBe(0)
  })

  it('keeps muted green subject details when they are bounded by non-white character colors', () => {
    const width = 5
    const height = 5
    const mask = new Uint8ClampedArray(width * height).fill(255)
    const imageData = new Uint8ClampedArray(width * height * 4)

    const setPixel = (x: number, y: number, red: number, green: number, blue: number) => {
      const index = ((y * width) + x) * 4
      imageData[index] = red
      imageData[index + 1] = green
      imageData[index + 2] = blue
      imageData[index + 3] = 255
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        setPixel(x, y, 40, 40, 40)
      }
    }

    setPixel(2, 2, 86, 126, 90)

    removeGreenBackgroundRegions(mask, imageData, width, height, 18)

    expect(mask[(2 * width) + 2]).toBe(255)
  })

  it('removes bright enclosed greenscreen pockets trapped within the subject silhouette', () => {
    const width = 7
    const height = 7
    const mask = new Uint8ClampedArray(width * height).fill(255)
    const imageData = new Uint8ClampedArray(width * height * 4)

    const setPixel = (x: number, y: number, red: number, green: number, blue: number) => {
      const index = ((y * width) + x) * 4
      imageData[index] = red
      imageData[index + 1] = green
      imageData[index + 2] = blue
      imageData[index + 3] = 255
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        setPixel(x, y, 42, 42, 42)
      }
    }

    setPixel(3, 3, 18, 176, 36)
    setPixel(4, 3, 24, 188, 44)
    setPixel(3, 4, 22, 182, 40)
    setPixel(4, 4, 20, 180, 38)

    removeGreenBackgroundRegions(mask, imageData, width, height, 18)

    expect(mask[(3 * width) + 3]).toBe(0)
    expect(mask[(3 * width) + 4]).toBe(0)
    expect(mask[(4 * width) + 3]).toBe(0)
    expect(mask[(4 * width) + 4]).toBe(0)
  })

  it('removes larger saturated interior spill regions even when not white-enclosed', () => {
    const width = 9
    const height = 9
    const mask = new Uint8ClampedArray(width * height).fill(255)
    const imageData = new Uint8ClampedArray(width * height * 4)

    const setPixel = (x: number, y: number, red: number, green: number, blue: number) => {
      const index = ((y * width) + x) * 4
      imageData[index] = red
      imageData[index + 1] = green
      imageData[index + 2] = blue
      imageData[index + 3] = 255
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        setPixel(x, y, 44, 44, 44)
      }
    }

    for (let y = 3; y <= 5; y += 1) {
      for (let x = 3; x <= 5; x += 1) {
        setPixel(x, y, 20, 175, 40)
      }
    }
    setPixel(4, 4, 36, 150, 50)

    removeGreenBackgroundRegions(mask, imageData, width, height, 18)

    expect(mask[(3 * width) + 3]).toBe(0)
    expect(mask[(3 * width) + 4]).toBe(0)
    expect(mask[(3 * width) + 5]).toBe(0)
    expect(mask[(4 * width) + 3]).toBe(0)
    expect(mask[(4 * width) + 4]).toBe(0)
    expect(mask[(4 * width) + 5]).toBe(0)
    expect(mask[(5 * width) + 3]).toBe(0)
    expect(mask[(5 * width) + 4]).toBe(0)
    expect(mask[(5 * width) + 5]).toBe(0)
  })

  it('preserves saturated green character regions that are not neon greenscreen spill', () => {
    const width = 9
    const height = 9
    const mask = new Uint8ClampedArray(width * height).fill(255)
    const imageData = new Uint8ClampedArray(width * height * 4)

    const setPixel = (x: number, y: number, red: number, green: number, blue: number) => {
      const index = ((y * width) + x) * 4
      imageData[index] = red
      imageData[index + 1] = green
      imageData[index + 2] = blue
      imageData[index + 3] = 255
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        setPixel(x, y, 44, 44, 44)
      }
    }

    const greenSkinSamples: Array<[number, number, number]> = [
      [112, 172, 80],
      [96, 160, 72],
      [124, 186, 94],
      [105, 168, 76],
    ]
    let sampleIndex = 0
    for (let y = 3; y <= 5; y += 1) {
      for (let x = 3; x <= 5; x += 1) {
        const sample = greenSkinSamples[sampleIndex % greenSkinSamples.length]
        setPixel(x, y, sample[0], sample[1], sample[2])
        sampleIndex += 1
      }
    }

    removeGreenBackgroundRegions(mask, imageData, width, height, 18)

    expect(mask[(3 * width) + 3]).toBe(255)
    expect(mask[(3 * width) + 4]).toBe(255)
    expect(mask[(3 * width) + 5]).toBe(255)
    expect(mask[(4 * width) + 3]).toBe(255)
    expect(mask[(4 * width) + 4]).toBe(255)
    expect(mask[(4 * width) + 5]).toBe(255)
    expect(mask[(5 * width) + 3]).toBe(255)
    expect(mask[(5 * width) + 4]).toBe(255)
    expect(mask[(5 * width) + 5]).toBe(255)
  })

  it('builds an outline mask with a softened outer edge instead of binary steps', () => {
    const width = 9
    const height = 9
    const mask = new Uint8ClampedArray(width * height)
    mask[(4 * width) + 4] = 255

    const outline = buildOutlineMask(mask, width, height, 3)

    expect(outline[(4 * width) + 3]).toBe(255)
    expect(outline[(2 * width) + 2]).toBeGreaterThan(0)
    expect(outline[(2 * width) + 2]).toBeLessThan(255)
    expect(outline[0]).toBe(0)
  })

  it('treats low-alpha fringe as background when building the outline mask', () => {
    const width = 7
    const height = 7
    const mask = new Uint8ClampedArray(width * height)
    const center = (3 * width) + 3
    mask[center] = 255
    mask[(3 * width) + 2] = 8
    mask[(3 * width) + 4] = 8

    const outline = buildOutlineMask(mask, width, height, 2, 18)

    expect(outline[(3 * width) + 2]).toBeGreaterThan(200)
    expect(outline[(3 * width) + 4]).toBeGreaterThan(200)
    expect(outline[center]).toBe(0)
  })

  it('drops thin edge-connected frame artifacts while keeping the dominant subject component', () => {
    const width = 12
    const height = 12
    const mask = new Uint8ClampedArray(width * height)
    const imageData = new Uint8ClampedArray(width * height * 4)

    const setPixel = (x: number, y: number, red: number, green: number, blue: number) => {
      const colorIndex = ((y * width) + x) * 4
      imageData[colorIndex] = red
      imageData[colorIndex + 1] = green
      imageData[colorIndex + 2] = blue
      imageData[colorIndex + 3] = 255
      mask[(y * width) + x] = 255
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          setPixel(x, y, 255, 255, 255)
        }
      }
    }

    for (let y = 4; y <= 8; y += 1) {
      for (let x = 4; x <= 7; x += 1) {
        setPixel(x, y, 42, 42, 42)
      }
    }

    keepDominantSubjectComponent(mask, imageData, width, height, 18)

    expect(mask[(0 * width) + 0]).toBe(0)
    expect(mask[(11 * width) + 11]).toBe(0)
    expect(mask[(6 * width) + 5]).toBe(255)
  })

  it('preserves a slender silhouette when removing frame-like components', () => {
    const width = 15
    const height = 15
    const mask = new Uint8ClampedArray(width * height)
    const imageData = new Uint8ClampedArray(width * height * 4)

    const setPixel = (x: number, y: number, red: number, green: number, blue: number) => {
      const colorIndex = ((y * width) + x) * 4
      imageData[colorIndex] = red
      imageData[colorIndex + 1] = green
      imageData[colorIndex + 2] = blue
      imageData[colorIndex + 3] = 255
      mask[(y * width) + x] = 255
    }

    for (let x = 0; x < width; x += 1) {
      setPixel(x, 0, 255, 255, 255)
    }

    for (let y = 2; y <= 12; y += 1) {
      setPixel(7, y, 46, 46, 46)
    }

    keepDominantSubjectComponent(mask, imageData, width, height, 18)

    expect(mask[(0 * width) + 3]).toBe(0)
    expect(mask[(8 * width) + 7]).toBe(255)
    expect(mask[(12 * width) + 7]).toBe(255)
  })

  it('removes green edge fringe but preserves interior green details', () => {
    const width = 5
    const height = 5
    const mask = new Uint8ClampedArray(width * height)
    const imageData = new Uint8ClampedArray(width * height * 4)

    const setPixel = (x: number, y: number, red: number, green: number, blue: number) => {
      const colorIndex = ((y * width) + x) * 4
      imageData[colorIndex] = red
      imageData[colorIndex + 1] = green
      imageData[colorIndex + 2] = blue
      imageData[colorIndex + 3] = 255
      mask[(y * width) + x] = 255
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        setPixel(x, y, 44, 44, 44)
      }
    }
    mask[(0 * width) + 2] = 0
    setPixel(2, 1, 20, 170, 40)
    setPixel(2, 2, 24, 176, 44)

    removeGreenEdgeFringe(mask, imageData, width, height, 18)

    expect(mask[(1 * width) + 2]).toBe(0)
    expect(mask[(2 * width) + 2]).toBe(255)
  })

  it('removes enclosed green islands surrounded mostly by white frame pixels', () => {
    const width = 8
    const height = 8
    const mask = new Uint8ClampedArray(width * height).fill(255)
    const imageData = new Uint8ClampedArray(width * height * 4)

    const setPixel = (x: number, y: number, red: number, green: number, blue: number) => {
      const index = ((y * width) + x) * 4
      imageData[index] = red
      imageData[index + 1] = green
      imageData[index + 2] = blue
      imageData[index + 3] = 255
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        setPixel(x, y, 42, 42, 42)
      }
    }

    for (let y = 2; y <= 5; y += 1) {
      for (let x = 2; x <= 5; x += 1) {
        if (x === 2 || x === 5 || y === 2 || y === 5) {
          setPixel(x, y, 255, 255, 255)
        }
      }
    }

    setPixel(3, 3, 20, 170, 40)
    setPixel(4, 3, 24, 176, 44)
    setPixel(3, 4, 22, 172, 42)
    setPixel(4, 4, 23, 178, 45)

    removeGreenBackgroundRegions(mask, imageData, width, height, 18)

    expect(mask[(3 * width) + 3]).toBe(0)
    expect(mask[(3 * width) + 4]).toBe(0)
    expect(mask[(4 * width) + 3]).toBe(0)
    expect(mask[(4 * width) + 4]).toBe(0)
  })
})
