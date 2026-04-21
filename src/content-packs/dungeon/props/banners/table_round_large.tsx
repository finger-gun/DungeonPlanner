import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonTableRoundLargeAsset = createDungeonAsset({
  id: 'dungeon.props_banners_table_round_large',
  slug: 'dungeon-props-banners-table-round-large',
  name: 'Dungeon Table Round Large',
  category: 'prop',
  modelName: 'table_round_large',
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
