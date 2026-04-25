import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonRocksDecoratedAsset = createDungeonAsset({
  id: 'dungeon.props_rocks_decorated',
  slug: 'dungeon-props-rocks-decorated',
  name: 'Dungeon Rocks Decorated',
  category: 'prop',
  modelName: 'rocks_decorated',
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
