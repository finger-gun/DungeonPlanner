import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonKeyAsset = createDungeonAsset({
  id: 'dungeon.props_key',
  slug: 'dungeon-props-key',
  name: 'Dungeon Key',
  category: 'prop',
  modelName: 'key',
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
