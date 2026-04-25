import { describe, expect, it } from 'vitest'
import { getThumbnailLayout } from './thumbnailLayout'

describe('getThumbnailLayout', () => {
  it('centers the model on all axes', () => {
    expect(
      getThumbnailLayout({
        min: [-2, -0.5, -1],
        max: [4, 3.5, 5],
      }),
    ).toMatchObject({
      modelPosition: [-1, -1.5, -2],
      target: [0, 0, 0],
    })
  })

  it('backs the camera up and reduces zoom for larger assets', () => {
    const small = getThumbnailLayout({
      min: [0, 0, 0],
      max: [1, 1, 1],
    })
    const large = getThumbnailLayout({
      min: [0, 0, 0],
      max: [8, 4, 6],
    })

    expect(large.cameraPosition[0]).toBeGreaterThan(small.cameraPosition[0])
    expect(large.far).toBeGreaterThan(small.far)
    expect(large.zoom).toBeLessThan(small.zoom)
  })
})
