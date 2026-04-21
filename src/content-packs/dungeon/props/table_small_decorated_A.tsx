import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableSmallDecoratedAAsset = createDungeonAsset({
  id: 'dungeon.props_table_small_decorated_A',
  slug: 'dungeon-props-table-small-decorated-A',
  name: 'Dungeon Table Small Decorated A',
  category: 'prop',
  modelName: 'table_small_decorated_A',
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
