import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBookTanAsset = createDungeonAsset({
  id: 'dungeon.props_book_tan',
  slug: 'dungeon-props-book-tan',
  name: 'Dungeon Book Tan',
  category: 'prop',
  modelName: 'book_tan',
  transform: DUNGEON_PROP_TRANSFORM,
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
