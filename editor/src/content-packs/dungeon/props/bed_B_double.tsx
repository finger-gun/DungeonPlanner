import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBedBDoubleAsset = createDungeonAsset({
  id: 'dungeon.props_bed_B_double',
  slug: 'dungeon-props-bed-B-double',
  name: 'Dungeon Bed B Double',
  category: 'prop',
  modelName: 'bed_B_double',
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
