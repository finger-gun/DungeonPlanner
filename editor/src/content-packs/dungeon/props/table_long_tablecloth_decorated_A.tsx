import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableLongTableclothDecoratedAAsset = createDungeonAsset({
  id: 'dungeon.props_table_long_tablecloth_decorated_A',
  slug: 'dungeon-props-table-long-tablecloth-decorated-A',
  name: 'Dungeon Table Long Tablecloth Decorated A',
  category: 'prop',
  modelName: 'table_long_tablecloth_decorated_A',
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
