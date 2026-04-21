import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonCrateLargeDecoratedAsset = createDungeonAsset({
  id: 'dungeon.props_crate_large_decorated',
  slug: 'dungeon-props-crate-large-decorated',
  name: 'Dungeon Crate Large Decorated',
  category: 'prop',
  modelName: 'crate_large_decorated',
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
