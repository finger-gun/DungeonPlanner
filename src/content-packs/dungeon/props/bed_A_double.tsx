import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBedADoubleAsset = createDungeonAsset({
  id: 'dungeon.props_bed_A_double',
  slug: 'dungeon-props-bed-A-double',
  name: 'Dungeon Bed A Double',
  category: 'prop',
  modelName: 'bed_A_double',
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
