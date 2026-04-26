import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBottleAGreenAsset = createDungeonAsset({
  id: 'dungeon.props_bottle_A_green',
  slug: 'dungeon-props-bottle-A-green',
  name: 'Dungeon Bottle A Green',
  category: 'prop',
  modelName: 'bottle_A_green',
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
