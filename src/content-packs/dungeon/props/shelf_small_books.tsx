import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonShelfSmallBooksAsset = createDungeonAsset({
  id: 'dungeon.props_shelf_small_books',
  slug: 'dungeon-props-shelf-small-books',
  name: 'Dungeon Shelf Small Books',
  category: 'prop',
  modelName: 'shelf_small_books',
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
