import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonRocksAsset = createDungeonAsset({
  id: 'dungeon.props_rocks',
  slug: 'dungeon-props-rocks',
  name: 'Dungeon Rocks',
  category: 'prop',
  modelName: 'rocks',
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
