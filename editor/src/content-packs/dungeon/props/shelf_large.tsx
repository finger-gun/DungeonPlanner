import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonShelfLargeAsset = createDungeonAsset({
  id: 'dungeon.props_shelf_large',
  slug: 'dungeon-props-shelf-large',
  name: 'Dungeon Shelf Large',
  category: 'prop',
  modelName: 'shelf_large',
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
