import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonRocksGoldAsset = createDungeonAsset({
  id: 'dungeon.props_rocks_gold',
  slug: 'dungeon-props-rocks-gold',
  name: 'Dungeon Rocks Gold',
  category: 'prop',
  modelName: 'rocks_gold',
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
