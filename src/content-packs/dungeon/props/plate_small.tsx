import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonPlateSmallAsset = createDungeonAsset({
  id: 'dungeon.props_plate_small',
  slug: 'dungeon-props-plate-small',
  name: 'Dungeon Plate Small',
  category: 'prop',
  modelName: 'plate_small',
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
