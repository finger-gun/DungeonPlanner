import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonShelfSmallAsset = createDungeonAsset({
  id: 'dungeon.props_shelf_small',
  slug: 'dungeon-props-shelf-small',
  name: 'Dungeon Shelf Small',
  category: 'prop',
  modelName: 'shelf_small',
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
