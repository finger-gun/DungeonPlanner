import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableSmallDecoratedBAsset = createDungeonAsset({
  id: 'dungeon.props_table_small_decorated_B',
  slug: 'dungeon-props-table-small-decorated-B',
  name: 'Dungeon Table Small Decorated B',
  category: 'prop',
  modelName: 'table_small_decorated_B',
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
