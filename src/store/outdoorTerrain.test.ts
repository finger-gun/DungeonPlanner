import { describe, expect, it } from 'vitest'
import {
  applyOutdoorTerrainSculpt,
  quantizeOutdoorTerrainHeight,
  sampleOutdoorTerrainHeight,
} from './outdoorTerrain'

describe('outdoorTerrain stepped quantization', () => {
  it('rounds heights to nearest sculpt step', () => {
    expect(quantizeOutdoorTerrainHeight(0.24)).toBe(0)
    expect(quantizeOutdoorTerrainHeight(0.26)).toBe(0.5)
    expect(quantizeOutdoorTerrainHeight(-0.26)).toBe(-0.5)
  })

  it('keeps sculpted heights on discrete step increments', () => {
    const once = applyOutdoorTerrainSculpt({}, [[0, 0]], 'raise', 0.5, 1)
    const twice = applyOutdoorTerrainSculpt(once, [[0, 0]], 'raise', 0.5, 1)
    expect(once['0:0']?.height).toBe(0.5)
    expect(twice['0:0']?.height).toBe(1)
  })

  it('samples the containing outdoor grid cell without slope interpolation', () => {
    const heightfield = {
      '0:0': { cell: [0, 0] as [number, number], height: 1 },
      '1:0': { cell: [1, 0] as [number, number], height: 0 },
    }

    expect(sampleOutdoorTerrainHeight(heightfield, 0.1, 0.1)).toBe(1)
    expect(sampleOutdoorTerrainHeight(heightfield, 2.1, 0.1)).toBe(0)
  })
})
