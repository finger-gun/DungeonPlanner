import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonCoinStackLargeAsset = createDungeonAsset({
  id: 'dungeon.props_coin_stack_large',
  slug: 'dungeon-props-coin-stack-large',
  name: 'Dungeon Coin Stack Large',
  category: 'prop',
  modelName: 'coin_stack_large',
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
