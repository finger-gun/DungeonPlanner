import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonCoinStackMediumAsset = createDungeonAsset({
  id: 'dungeon.props_coin_stack_medium',
  slug: 'dungeon-props-coin-stack-medium',
  name: 'Dungeon Coin Stack Medium',
  category: 'prop',
  modelName: 'coin_stack_medium',
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
