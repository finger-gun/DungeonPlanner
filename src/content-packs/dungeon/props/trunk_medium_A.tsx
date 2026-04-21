import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTrunkMediumAAsset = createDungeonAsset({
  id: 'dungeon.props_trunk_medium_A',
  slug: 'dungeon-props-trunk-medium-A',
  name: 'Dungeon Trunk Medium A',
  category: 'prop',
  modelName: 'trunk_medium_A',
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
