import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonChestGoldAsset = createDungeonAsset({
  id: 'dungeon.props_chest_gold',
  slug: 'dungeon-props-chest-gold',
  name: 'Dungeon Chest Gold',
  category: 'prop',
  modelName: 'chest_gold',
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
