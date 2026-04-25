import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBookBrownAsset = createDungeonAsset({
  id: 'dungeon.props_book_brown',
  slug: 'dungeon-props-book-brown',
  name: 'Dungeon Book Brown',
  category: 'prop',
  modelName: 'book_brown',
  transform: DUNGEON_PROP_TRANSFORM,
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
