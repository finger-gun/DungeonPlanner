import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableLongTableclothAsset = createDungeonAsset({
  id: 'dungeon.props_table_long_tablecloth',
  slug: 'dungeon-props-table-long-tablecloth',
  name: 'Dungeon Table Long Tablecloth',
  category: 'prop',
  modelName: 'table_long_tablecloth',
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
