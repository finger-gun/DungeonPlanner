import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonPlateStackAsset = createDungeonAsset({
  id: 'dungeon.props_plate_stack',
  slug: 'dungeon-props-plate-stack',
  name: 'Dungeon Plate Stack',
  category: 'prop',
  modelName: 'plate_stack',
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
