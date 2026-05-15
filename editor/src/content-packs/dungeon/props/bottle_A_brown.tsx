import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'

export const dungeonBottleABrownAsset = createGenericColorSwatch({
  id: 'dungeon.props_bottle_A_brown',
  slug: 'dungeon-props-bottle-A-brown',
  name: 'Dungeon Bottle A Brown',
  modelName: 'bottle_A_brown',
  sourceCells: [[6, 0]],
  variants: DUNGEON_COLOR_SWATCHES,
  defaultVariantId: 'brown',
  metadata: {
    snapsTo: 'FREE',
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
      {
        point: [0, 0, 0],
        type: 'SURFACE',
      },
    ],
    blocksLineOfSight: false,
  },
})
