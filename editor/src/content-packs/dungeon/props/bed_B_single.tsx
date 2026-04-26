import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBedBSingleAsset = createDungeonAsset({
  id: 'dungeon.props_bed_B_single',
  slug: 'dungeon-props-bed-B-single',
  name: 'Dungeon Bed B Single',
  category: 'prop',
  modelName: 'bed_B_single',
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
