import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'

export const dungeonBookBrownAsset = createGenericColorSwatch({
  id: 'dungeon.props_book_brown',
  slug: 'dungeon-props-book-brown',
  name: 'Dungeon Book Brown',
  modelName: 'book_brown',
  sourceCells: [[6, 0]],
  variants: DUNGEON_COLOR_SWATCHES,
  defaultVariantId: 'brown',
  metadata: {
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
      {
        point: [0, 0, 0],
        type: 'SURFACE',
      },
    ],  // Can be placed on floor or surfaces
    snapsTo: 'FREE',
    blocksLineOfSight: false,
  },
})
