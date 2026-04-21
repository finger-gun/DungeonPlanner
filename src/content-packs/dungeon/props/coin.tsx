import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonCoinAsset = createDungeonAsset({
  id: 'dungeon.props_coin',
  slug: 'dungeon-props-coin',
  name: 'Dungeon Coin',
  category: 'prop',
  modelName: 'coin',
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
