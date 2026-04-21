import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableSmallDecoratedCAsset = createDungeonAsset({
  id: 'dungeon.props_table_small_decorated_C',
  slug: 'dungeon-props-table-small-decorated-C',
  name: 'Dungeon Table Small Decorated C',
  category: 'prop',
  modelName: 'table_small_decorated_C',
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
