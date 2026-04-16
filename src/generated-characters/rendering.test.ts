import { describe, expect, it } from 'vitest'
import {
  GENERATED_CHARACTER_BASE_RADIUS,
  GENERATED_CHARACTER_INDICATOR_OUTER_DIAMETER_RATIO,
  getGeneratedCharacterIndicatorSize,
  getGeneratedCharacterScale,
} from './rendering'

describe('generated character rendering helpers', () => {
  it('scales standees by size tier', () => {
    expect(getGeneratedCharacterScale('S')).toBeLessThan(getGeneratedCharacterScale('M'))
    expect(getGeneratedCharacterScale('XL')).toBeGreaterThan(getGeneratedCharacterScale('M'))
    expect(getGeneratedCharacterScale('XXL')).toBeGreaterThan(getGeneratedCharacterScale('XL'))
  })

  it('sizes the projected indicator wider than the standee base', () => {
    ;(['S', 'M', 'XL', 'XXL'] as const).forEach((size) => {
      const baseDiameter = GENERATED_CHARACTER_BASE_RADIUS * getGeneratedCharacterScale(size) * 2
      const visibleOuterDiameter =
        getGeneratedCharacterIndicatorSize(size) * GENERATED_CHARACTER_INDICATOR_OUTER_DIAMETER_RATIO
      expect(visibleOuterDiameter).toBeGreaterThan(baseDiameter + 0.3)
    })
  })
})
