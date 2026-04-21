import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableLongDecoratedCAsset = createDungeonAsset({
  id: 'dungeon.props_table_long_decorated_C',
  slug: 'dungeon-props-table-long-decorated-C',
  name: 'Dungeon Table Long Decorated C',
  category: 'prop',
  modelName: 'table_long_decorated_C',
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
