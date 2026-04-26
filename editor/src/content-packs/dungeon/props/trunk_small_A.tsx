import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTrunkSmallAAsset = createDungeonAsset({
  id: 'dungeon.props_trunk_small_A',
  slug: 'dungeon-props-trunk-small-A',
  name: 'Dungeon Trunk Small A',
  category: 'prop',
  modelName: 'trunk_small_A',
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
