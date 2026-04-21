import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBookGreyAsset = createDungeonAsset({
  id: 'dungeon.props_book_grey',
  slug: 'dungeon-props-book-grey',
  name: 'Dungeon Book Grey',
  category: 'prop',
  modelName: 'book_grey',
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
