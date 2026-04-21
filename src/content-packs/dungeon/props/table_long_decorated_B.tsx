import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableLongDecoratedBAsset = createDungeonAsset({
  id: 'dungeon.props_table_long_decorated_B',
  slug: 'dungeon-props-table-long-decorated-B',
  name: 'Dungeon Table Long Decorated B',
  category: 'prop',
  modelName: 'table_long_decorated_B',
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
