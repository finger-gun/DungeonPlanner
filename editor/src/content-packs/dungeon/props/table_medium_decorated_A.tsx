import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableMediumDecoratedAAsset = createDungeonAsset({
  id: 'dungeon.props_table_medium_decorated_A',
  slug: 'dungeon-props-table-medium-decorated-A',
  name: 'Dungeon Table Medium Decorated A',
  category: 'prop',
  modelName: 'table_medium_decorated_A',
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
