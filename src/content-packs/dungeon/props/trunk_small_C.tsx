import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTrunkSmallCAsset = createDungeonAsset({
  id: 'dungeon.props_trunk_small_C',
  slug: 'dungeon-props-trunk-small-C',
  name: 'Dungeon Trunk Small C',
  category: 'prop',
  modelName: 'trunk_small_C',
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
