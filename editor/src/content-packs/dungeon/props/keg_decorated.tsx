import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonKegDecoratedAsset = createDungeonAsset({
  id: 'dungeon.props_keg_decorated',
  slug: 'dungeon-props-keg-decorated',
  name: 'Dungeon Keg Decorated',
  category: 'prop',
  modelName: 'keg_decorated',
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
