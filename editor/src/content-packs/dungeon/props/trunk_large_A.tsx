import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTrunkLargeAAsset = createDungeonAsset({
  id: 'dungeon.props_trunk_large_A',
  slug: 'dungeon-props-trunk-large-A',
  name: 'Dungeon Trunk Large A',
  category: 'prop',
  modelName: 'trunk_large_A',
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
