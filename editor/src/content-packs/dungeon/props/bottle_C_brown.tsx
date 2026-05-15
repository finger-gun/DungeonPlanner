import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'

export const dungeonBottleCBrownAsset = createGenericColorSwatch({
  id: 'dungeon.props_bottle_C_brown',
  slug: 'dungeon-props-bottle-C-brown',
  name: 'Dungeon Bottle C Brown',
  modelName: 'bottle_C_brown',
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
