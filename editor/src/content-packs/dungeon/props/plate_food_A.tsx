import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonPlateFoodAAsset = createDungeonAsset({
  id: 'dungeon.props_plate_food_A',
  slug: 'dungeon-props-plate-food-A',
  name: 'Dungeon Plate Food A',
  category: 'prop',
  modelName: 'plate_food_A',
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
