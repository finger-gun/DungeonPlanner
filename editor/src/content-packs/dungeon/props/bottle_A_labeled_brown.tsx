import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'

export const dungeonBottleALabeledBrownAsset = createGenericColorSwatch({
  id: 'dungeon.props_bottle_A_labeled_brown',
  slug: 'dungeon-props-bottle-A-labeled-brown',
  name: 'Dungeon Bottle A Labeled Brown',
  modelName: 'bottle_A_labeled_brown',
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
