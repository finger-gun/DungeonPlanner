import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBoxStackedAsset = createDungeonAsset({
  id: 'dungeon.props_box_stacked',
  slug: 'dungeon-props-box-stacked',
  name: 'Dungeon Box Stacked',
  category: 'prop',
  modelName: 'box_stacked',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    blocksLineOfSight: false,
  },
})
