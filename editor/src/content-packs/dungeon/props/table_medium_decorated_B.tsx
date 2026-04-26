import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableMediumDecoratedBAsset = createDungeonAsset({
  id: 'dungeon.props_table_medium_decorated_B',
  slug: 'dungeon-props-table-medium-decorated-B',
  name: 'Dungeon Table Medium Decorated B',
  category: 'prop',
  modelName: 'table_medium_decorated_B',
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
