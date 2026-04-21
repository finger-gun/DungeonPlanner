import type { GeneratedCharacterKind, GeneratedCharacterSize } from './types'

export const GENERATED_CHARACTER_BASE_RADIUS = 0.34
export const GENERATED_CHARACTER_BASE_HEIGHT = 0.08
export const GENERATED_CHARACTER_CARD_HEIGHT = 1.85
export const GENERATED_CHARACTER_CARD_THICKNESS = 0.056
export const GENERATED_CHARACTER_CARD_FACE_OFFSET = GENERATED_CHARACTER_CARD_THICKNESS * 0.5
export const GENERATED_CHARACTER_CARD_SURFACE_OFFSET = GENERATED_CHARACTER_CARD_FACE_OFFSET + 0.0015
export const GENERATED_CHARACTER_CARD_Y_OFFSET = GENERATED_CHARACTER_BASE_HEIGHT + (GENERATED_CHARACTER_CARD_HEIGHT * 0.5) + 0.04
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

export function getGeneratedStandeeCardDimensions(width?: number | null, height?: number | null) {
  const aspect = width && height && height > 0 ? width / height : 0.7
  return {
    cardWidth: Math.max(0.72, GENERATED_CHARACTER_CARD_HEIGHT * aspect),
    cardHeight: GENERATED_CHARACTER_CARD_HEIGHT,
  }
}

export function getGeneratedStandeeSupportWidth(cardWidth: number) {
  return Math.min(cardWidth * 0.6, 0.58)
}

export function getGeneratedStandeeBasePalette(kind: GeneratedCharacterKind) {
  if (kind === 'npc') {
    return {
      baseColor: '#6a3f3a',
      supportColor: '#c5968d',
    }
  }

  return {
    baseColor: '#4a5f42',
    supportColor: '#afbc98',
  }
}
