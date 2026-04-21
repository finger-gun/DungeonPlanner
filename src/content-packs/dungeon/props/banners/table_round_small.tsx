import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonTableRoundSmallAsset = createDungeonAsset({
  id: 'dungeon.props_banners_table_round_small',
  slug: 'dungeon-props-banners-table-round-small',
  name: 'Dungeon Table Round Small',
  category: 'prop',
  modelName: 'table_round_small',
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
