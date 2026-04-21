import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonKeyGoldAsset = createDungeonAsset({
  id: 'dungeon.props_key_gold',
  slug: 'dungeon-props-key-gold',
  name: 'Dungeon Key Gold',
  category: 'prop',
  modelName: 'key_gold',
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
