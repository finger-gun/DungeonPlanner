import { describe, expect, it } from 'vitest'
import { buildOutlineMask, isGreenishBackgroundPixel, removeGreenBackgroundRegions } from './processing'

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

  it('keeps green subject details when they are bounded by non-white character colors', () => {
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

    setPixel(2, 2, 24, 190, 48)

    removeGreenBackgroundRegions(mask, imageData, width, height, 18)

    expect(mask[(2 * width) + 2]).toBe(255)
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
})
