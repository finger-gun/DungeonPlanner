import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTrunkLargeBAsset = createDungeonAsset({
  id: 'dungeon.props_trunk_large_B',
  slug: 'dungeon-props-trunk-large-B',
  name: 'Dungeon Trunk Large B',
  category: 'prop',
  modelName: 'trunk_large_B',
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
