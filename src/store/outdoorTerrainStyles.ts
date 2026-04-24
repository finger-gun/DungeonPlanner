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

export const DEFAULT_OUTDOOR_TERRAIN_STYLE: OutdoorTerrainStyle = 'Color1'
