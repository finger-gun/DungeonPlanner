import { describe, expect, it } from 'vitest'
import {
  GENERATED_CHARACTER_CARD_HEIGHT,
  GENERATED_CHARACTER_BASE_RADIUS,
  GENERATED_CHARACTER_INDICATOR_OUTER_DIAMETER_RATIO,
  getGeneratedCharacterIndicatorSize,
  getGeneratedCharacterScale,
  getGeneratedStandeeBasePalette,
  getGeneratedStandeeCardDimensions,
  getGeneratedStandeeSupportWidth,
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

  it('derives stable card dimensions for standee surface meshes', () => {
    expect(getGeneratedStandeeCardDimensions(300, 600)).toEqual({
      cardWidth: GENERATED_CHARACTER_CARD_HEIGHT * 0.5,
      cardHeight: GENERATED_CHARACTER_CARD_HEIGHT,
    })
    expect(getGeneratedStandeeCardDimensions(null, null)).toEqual({
      cardWidth: Math.max(0.72, GENERATED_CHARACTER_CARD_HEIGHT * 0.7),
      cardHeight: GENERATED_CHARACTER_CARD_HEIGHT,
    })
  })

  it('caps the standee support width for wide cards', () => {
    expect(getGeneratedStandeeSupportWidth(0.8)).toBeCloseTo(0.48)
    expect(getGeneratedStandeeSupportWidth(2)).toBe(0.58)
  })

  it('uses distinct base palettes for players and npcs', () => {
    expect(getGeneratedStandeeBasePalette('player')).toEqual({
      baseColor: '#4a5f42',
      supportColor: '#afbc98',
    })
    expect(getGeneratedStandeeBasePalette('npc')).toEqual({
      baseColor: '#6a3f3a',
      supportColor: '#c5968d',
    })
  })
})
