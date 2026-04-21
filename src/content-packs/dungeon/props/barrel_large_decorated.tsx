import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBarrelLargeDecoratedAsset = createDungeonAsset({
  id: 'dungeon.props_barrel_large_decorated',
  slug: 'dungeon-props-barrel-large-decorated',
  name: 'Dungeon Barrel Large Decorated',
  category: 'prop',
  modelName: 'barrel_large_decorated',
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
