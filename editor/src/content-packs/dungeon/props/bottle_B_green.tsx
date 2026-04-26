import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBottleBGreenAsset = createDungeonAsset({
  id: 'dungeon.props_bottle_B_green',
  slug: 'dungeon-props-bottle-B-green',
  name: 'Dungeon Bottle B Green',
  category: 'prop',
  modelName: 'bottle_B_green',
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
