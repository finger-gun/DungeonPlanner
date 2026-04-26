import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableSmallAsset = createDungeonAsset({
  id: 'dungeon.props_table_small',
  slug: 'dungeon-props-table-small',
  name: 'Dungeon Table Small',
  category: 'prop',
  modelName: 'table_small',
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
