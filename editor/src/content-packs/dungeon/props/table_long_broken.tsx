import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableLongBrokenAsset = createDungeonAsset({
  id: 'dungeon.props_table_long_broken',
  slug: 'dungeon-props-table-long-broken',
  name: 'Dungeon Table Long Broken',
  category: 'prop',
  modelName: 'table_long_broken',
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
