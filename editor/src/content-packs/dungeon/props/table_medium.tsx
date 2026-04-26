import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTableMediumAsset = createDungeonAsset({
  id: 'dungeon.props_table_medium',
  slug: 'dungeon-props-table-medium',
  name: 'Dungeon Table Medium',
  category: 'prop',
  modelName: 'table_medium',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    propSurface: true,  // Items can be placed on table
    blocksLineOfSight: false,
  },
})

