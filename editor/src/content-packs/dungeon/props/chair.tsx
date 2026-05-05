import { getAtlasCellKey } from '../../shared/atlasColorVariants'
import { buildDungeonColorVariants, createGenericColorSwatch } from '../shared/dungeonColorAtlas'

const CHAIR_COLOR_SOURCE_CELL = [4, 0] as const

const CHAIR_COLOR_VARIANTS = buildDungeonColorVariants({
  namedVariantsByCell: {
    [getAtlasCellKey(CHAIR_COLOR_SOURCE_CELL)]: {
      id: 'default',
      label: 'Default',
    },
  },
})

export const dungeonChairAsset = createGenericColorSwatch({
  id: 'dungeon.props_chair',
  slug: 'dungeon-props-chair',
  name: 'Dungeon Chair',
  modelName: 'chair',
  sourceCells: [CHAIR_COLOR_SOURCE_CELL],
  variants: CHAIR_COLOR_VARIANTS,
  defaultVariantId: 'default',
  metadata: {
    snapsTo: 'FREE',
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    blocksLineOfSight: false,
  },
})
