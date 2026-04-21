import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBoxSmallDecoratedAsset = createDungeonAsset({
  id: 'dungeon.props_box_small_decorated',
  slug: 'dungeon-props-box-small-decorated',
  name: 'Dungeon Box Small Decorated',
  category: 'prop',
  modelName: 'box_small_decorated',
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
