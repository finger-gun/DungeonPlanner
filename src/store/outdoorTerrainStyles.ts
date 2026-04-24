export const OUTDOOR_TERRAIN_STYLES = [
  'Color1',
  'Color2',
  'Color3',
  'Color4',
  'Color5',
  'Color6',
  'Color7',
  'Color8',
] as const

export type OutdoorTerrainStyle = typeof OUTDOOR_TERRAIN_STYLES[number]

export const OUTDOOR_TERRAIN_STYLE_LABELS: Record<OutdoorTerrainStyle, string> = {
  Color1: 'Lush',
  Color2: 'Bright',
  Color3: 'Moss',
  Color4: 'Fern',
  Color5: 'Olive',
  Color6: 'Dry',
  Color7: 'Muted',
  Color8: 'Ash',
}

export const DEFAULT_OUTDOOR_TERRAIN_STYLE: OutdoorTerrainStyle = 'Color1'

export function getOutdoorTerrainStyleLabel(style: OutdoorTerrainStyle) {
  return OUTDOOR_TERRAIN_STYLE_LABELS[style]
}
