import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonChestLargeGoldAsset = createDungeonAsset({
  id: 'dungeon.props_chest_large_gold',
  slug: 'dungeon-props-chest-large-gold',
  name: 'Dungeon Chest Large Gold',
  category: 'prop',
  modelName: 'chest_large_gold',
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
