import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonPlateFoodBAsset = createDungeonAsset({
  id: 'dungeon.props_plate_food_B',
  slug: 'dungeon-props-plate-food-B',
  name: 'Dungeon Plate Food B',
  category: 'prop',
  modelName: 'plate_food_B',
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
