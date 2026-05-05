import type { ContentPackAsset, ContentPackAssetMetadata } from '../../types'
import {
  buildAtlasColorVariants,
  createAtlasColorVariantModelComponent,
  type AtlasCell,
  type AtlasColorSwatchVariant,
} from '../../shared/atlasColorVariants'
import { createDungeonAsset, resolveDungeonModelAssetUrl, type DungeonTransform } from './createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from './dungeonConstants'

export const DUNGEON_COLOR_ATLAS_COLUMNS = 8
export const DUNGEON_COLOR_ATLAS_ROWS = 4

const DUNGEON_COLOR_ATLAS_SWATCH_COLOR_MATRIX_TOP_ORIGIN = [
  ['#4b5155', '#828c91', '#b27052', '#13191b', '#9b5a44', '#958d84', '#c26331', '#6b5d53'],
  ['#d5dcdf', '#daae7d', '#7b8e9d', '#672f8d', '#a41a5a', '#51aaaf', '#5cb56b', '#f69473'],
  ['#38a48d', '#53ab47', '#f3737f', '#d1272e', '#f9aa4f', '#eac254', '#63a0d0', '#f99f3a'],
  ['#ddd0c4', '#d19846', '#257ebc', '#38a48d', '#008454', '#8e8e8d', '#8e8e8d', '#8e8e8d'],
] as const

export function getDungeonAtlasSwatchColor(cell: AtlasCell) {
  return DUNGEON_COLOR_ATLAS_SWATCH_COLOR_MATRIX_TOP_ORIGIN[cell[1]]?.[cell[0]] ?? '#9ca3af'
}

export function buildDungeonColorVariants({
  excludedCells = [],
  namedVariantsByCell = {},
}: {
  excludedCells?: AtlasCell[]
  namedVariantsByCell?: Record<string, { id: string; label: string }>
}) {
  return buildAtlasColorVariants({
    columns: DUNGEON_COLOR_ATLAS_COLUMNS,
    rows: DUNGEON_COLOR_ATLAS_ROWS,
    excludedCells,
    namedVariantsByCell,
    swatchColorsTopOrigin: DUNGEON_COLOR_ATLAS_SWATCH_COLOR_MATRIX_TOP_ORIGIN,
  })
}

export function createGenericColorSwatch({
  id,
  slug,
  name,
  modelName,
  sourceCells,
  variants,
  defaultVariantId,
  metadata,
  propKey = 'colorVariant',
  transform = DUNGEON_PROP_TRANSFORM,
}: {
  id: string
  slug: string
  name: string
  modelName: string
  sourceCells: AtlasCell[]
  variants: AtlasColorSwatchVariant[]
  defaultVariantId: string
  metadata?: ContentPackAssetMetadata
  propKey?: string
  transform?: DungeonTransform
}): ContentPackAsset {
  const assetUrl = resolveDungeonModelAssetUrl(modelName)

  if (!assetUrl) {
    throw new Error(`Missing dungeon model asset: ${modelName}`)
  }

  return createDungeonAsset({
    id,
    slug,
    name,
    category: 'prop',
    modelName,
    transform,
    Component: createAtlasColorVariantModelComponent({
      assetUrl,
      transform: transform ?? DUNGEON_PROP_TRANSFORM,
      sourceCells,
      variants,
      propKey,
      defaultVariantId,
      grid: {
        columns: DUNGEON_COLOR_ATLAS_COLUMNS,
        rows: DUNGEON_COLOR_ATLAS_ROWS,
      },
    }),
    metadata: {
      ...metadata,
      atlasColorVariants: {
        propKey,
        defaultVariantId,
        variants,
      },
    },
  })
}

export type { AtlasCell, AtlasColorSwatchVariant }
