import { describe, expect, it } from 'vitest'
import { solidifyMaskCoveragePixels } from './roomFloorMaskRuntime'

describe('roomFloorMaskRuntime', () => {
  it('converts partially covered mask pixels into fully opaque coverage', () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255,
      64, 64, 64, 255,
      128, 128, 128, 255,
      191, 191, 191, 255,
      255, 255, 255, 255,
    ])

    solidifyMaskCoveragePixels({ data })

    expect([...data]).toEqual([
      0, 0, 0, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
    ])
  })
})
