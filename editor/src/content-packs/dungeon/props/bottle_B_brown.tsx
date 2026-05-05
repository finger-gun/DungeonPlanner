import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'

export const dungeonBottleBBrownAsset = createGenericColorSwatch({
  id: 'dungeon.props_bottle_B_brown',
  slug: 'dungeon-props-bottle-B-brown',
  name: 'Dungeon Bottle B Brown',
  modelName: 'bottle_B_brown',
  sourceCells: [[6, 0]],
  variants: DUNGEON_COLOR_SWATCHES,
  defaultVariantId: 'brown',
  metadata: {
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    blocksLineOfSight: false,
  },
})
