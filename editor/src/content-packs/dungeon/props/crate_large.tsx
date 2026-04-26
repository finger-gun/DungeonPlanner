import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonCrateLargeAsset = createDungeonAsset({
  id: 'dungeon.props_crate_large',
  slug: 'dungeon-props-crate-large',
  name: 'Dungeon Crate Large',
  category: 'prop',
  modelName: 'crate_large',
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
