import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableLongDecoratedAAsset = createDungeonAsset({
  id: 'dungeon.props_table_long_decorated_A',
  slug: 'dungeon-props-table-long-decorated-A',
  name: 'Dungeon Table Long Decorated A',
  category: 'prop',
  modelName: 'table_long_decorated_A',
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
