import type { GeneratedCharacterSize } from './types'

export const GENERATED_CHARACTER_BASE_RADIUS = 0.34
export const GENERATED_CHARACTER_INDICATOR_OUTER_DIAMETER_RATIO = 86 / 128
const PLAYER_INDICATOR_VISIBLE_MARGIN = 0.18

export function getGeneratedCharacterScale(size: GeneratedCharacterSize) {
  switch (size) {
    case 'S':
      return 0.82
    case 'XL':
      return 1.35
    case 'XXL':
      return 1.85
    case 'M':
    default:
      return 1
  }
}

export function getGeneratedCharacterIndicatorSize(size: GeneratedCharacterSize) {
  const scaledBaseDiameter = GENERATED_CHARACTER_BASE_RADIUS * getGeneratedCharacterScale(size) * 2
  const targetVisibleOuterDiameter = scaledBaseDiameter + PLAYER_INDICATOR_VISIBLE_MARGIN * 2
  return targetVisibleOuterDiameter / GENERATED_CHARACTER_INDICATOR_OUTER_DIAMETER_RATIO
}
