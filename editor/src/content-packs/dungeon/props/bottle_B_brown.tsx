import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBottleBBrownAsset = createDungeonAsset({
  id: 'dungeon.props_bottle_B_brown',
  slug: 'dungeon-props-bottle-B-brown',
  name: 'Dungeon Bottle B Brown',
  category: 'prop',
  modelName: 'bottle_B_brown',
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
