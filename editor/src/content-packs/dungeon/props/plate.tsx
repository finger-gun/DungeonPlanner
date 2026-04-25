import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonPlateAsset = createDungeonAsset({
  id: 'dungeon.props_plate',
  slug: 'dungeon-props-plate',
  name: 'Dungeon Plate',
  category: 'prop',
  modelName: 'plate',
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
