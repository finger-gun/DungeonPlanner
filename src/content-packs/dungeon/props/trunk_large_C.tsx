import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonTrunkLargeCAsset = createDungeonAsset({
  id: 'dungeon.props_trunk_large_C',
  slug: 'dungeon-props-trunk-large-C',
  name: 'Dungeon Trunk Large C',
  category: 'prop',
  modelName: 'trunk_large_C',
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
