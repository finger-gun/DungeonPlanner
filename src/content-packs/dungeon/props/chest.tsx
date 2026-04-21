import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonChestAsset = createDungeonAsset({
  id: 'dungeon.props_chest',
  slug: 'dungeon-props-chest',
  name: 'Dungeon Chest',
  category: 'prop',
  modelName: 'chest',
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
