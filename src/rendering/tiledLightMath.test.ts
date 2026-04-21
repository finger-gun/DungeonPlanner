import { describe, expect, it } from 'vitest'
import { getTiledLightGridDimension, getTiledLightWorkgroupCount } from './tiledLightMath'

describe('tiledLightMath', () => {
  it('derives tile grid dimensions from the tile size', () => {
    expect(getTiledLightGridDimension(1920, 32)).toBe(60)
    expect(getTiledLightGridDimension(1088, 32)).toBe(34)
  })

  it('computes one workgroup per screen tile instead of per pixel row', () => {
    expect(getTiledLightWorkgroupCount(1920, 1088, 32)).toBe(2040)
  })
})
