import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTrunkMediumBAsset = createDungeonAsset({
  id: 'dungeon.props_trunk_medium_B',
  slug: 'dungeon-props-trunk-medium-B',
  name: 'Dungeon Trunk Medium B',
  category: 'prop',
  modelName: 'trunk_medium_B',
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
