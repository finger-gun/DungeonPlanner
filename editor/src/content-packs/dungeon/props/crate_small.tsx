import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonCrateSmallAsset = createDungeonAsset({
  id: 'dungeon.props_crate_small',
  slug: 'dungeon-props-crate-small',
  name: 'Dungeon Crate Small',
  category: 'prop',
  modelName: 'crate_small',
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
