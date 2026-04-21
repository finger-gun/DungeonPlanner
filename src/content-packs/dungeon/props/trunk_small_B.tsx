import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTrunkSmallBAsset = createDungeonAsset({
  id: 'dungeon.props_trunk_small_B',
  slug: 'dungeon-props-trunk-small-B',
  name: 'Dungeon Trunk Small B',
  category: 'prop',
  modelName: 'trunk_small_B',
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
