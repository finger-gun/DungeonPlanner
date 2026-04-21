import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonRubbleLargeAsset = createDungeonAsset({
  id: 'dungeon.props_rubble_large',
  slug: 'dungeon-props-rubble-large',
  name: 'Dungeon Rubble Large',
  category: 'prop',
  modelName: 'rubble_large',
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
