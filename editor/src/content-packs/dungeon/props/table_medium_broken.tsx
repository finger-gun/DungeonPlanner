import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableMediumBrokenAsset = createDungeonAsset({
  id: 'dungeon.props_table_medium_broken',
  slug: 'dungeon-props-table-medium-broken',
  name: 'Dungeon Table Medium Broken',
  category: 'prop',
  modelName: 'table_medium_broken',
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
