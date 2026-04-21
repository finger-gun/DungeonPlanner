import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableLongAsset = createDungeonAsset({
  id: 'dungeon.props_table_long',
  slug: 'dungeon-props-table-long',
  name: 'Dungeon Table Long',
  category: 'prop',
  modelName: 'table_long',
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
