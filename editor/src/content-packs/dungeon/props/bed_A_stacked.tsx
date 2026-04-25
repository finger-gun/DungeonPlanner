import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBedAStackedAsset = createDungeonAsset({
  id: 'dungeon.props_bed_A_stacked',
  slug: 'dungeon-props-bed-A-stacked',
  name: 'Dungeon Bed A Stacked',
  category: 'prop',
  modelName: 'bed_A_stacked',
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
