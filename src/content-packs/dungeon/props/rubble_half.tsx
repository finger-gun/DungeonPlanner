import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonRubbleHalfAsset = createDungeonAsset({
  id: 'dungeon.props_rubble_half',
  slug: 'dungeon-props-rubble-half',
  name: 'Dungeon Rubble Half',
  category: 'prop',
  modelName: 'rubble_half',
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
