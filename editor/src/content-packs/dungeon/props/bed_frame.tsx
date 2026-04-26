import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBedFrameAsset = createDungeonAsset({
  id: 'dungeon.props_bed_frame',
  slug: 'dungeon-props-bed-frame',
  name: 'Dungeon Bed Frame',
  category: 'prop',
  modelName: 'bed_frame',
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
