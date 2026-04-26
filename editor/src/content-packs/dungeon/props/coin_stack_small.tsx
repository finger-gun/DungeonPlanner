import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonCoinStackSmallAsset = createDungeonAsset({
  id: 'dungeon.props_coin_stack_small',
  slug: 'dungeon-props-coin-stack-small',
  name: 'Dungeon Coin Stack Small',
  category: 'prop',
  modelName: 'coin_stack_small',
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
