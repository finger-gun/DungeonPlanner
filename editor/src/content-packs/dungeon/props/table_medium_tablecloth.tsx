import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableMediumTableclothAsset = createDungeonAsset({
  id: 'dungeon.props_table_medium_tablecloth',
  slug: 'dungeon-props-table-medium-tablecloth',
  name: 'Dungeon Table Medium Tablecloth',
  category: 'prop',
  modelName: 'table_medium_tablecloth',
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
