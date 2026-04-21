import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBedFloorAsset = createDungeonAsset({
  id: 'dungeon.props_bed_floor',
  slug: 'dungeon-props-bed-floor',
  name: 'Dungeon Bed Floor',
  category: 'prop',
  modelName: 'bed_floor',
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
