import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBottleCBrownAsset = createDungeonAsset({
  id: 'dungeon.props_bottle_C_brown',
  slug: 'dungeon-props-bottle-C-brown',
  name: 'Dungeon Bottle C Brown',
  category: 'prop',
  modelName: 'bottle_C_brown',
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
