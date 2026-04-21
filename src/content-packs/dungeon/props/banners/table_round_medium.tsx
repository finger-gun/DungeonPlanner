import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonTableRoundMediumAsset = createDungeonAsset({
  id: 'dungeon.props_banners_table_round_medium',
  slug: 'dungeon-props-banners-table-round-medium',
  name: 'Dungeon Table Round Medium',
  category: 'prop',
  modelName: 'table_round_medium',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectors: [
      {
        point: [0, 0, 0],
        type: 'WALL',
      },
    ],
    blocksLineOfSight: false,
  },
})
