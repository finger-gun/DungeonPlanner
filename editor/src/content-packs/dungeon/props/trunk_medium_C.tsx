import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTrunkMediumCAsset = createDungeonAsset({
  id: 'dungeon.props_trunk_medium_C',
  slug: 'dungeon-props-trunk-medium-C',
  name: 'Dungeon Trunk Medium C',
  category: 'prop',
  modelName: 'trunk_medium_C',
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
