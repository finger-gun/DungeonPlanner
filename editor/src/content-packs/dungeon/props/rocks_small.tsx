import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonRocksSmallAsset = createDungeonAsset({
  id: 'dungeon.props_rocks_small',
  slug: 'dungeon-props-rocks-small',
  name: 'Dungeon Rocks Small',
  category: 'prop',
  modelName: 'rocks_small',
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
