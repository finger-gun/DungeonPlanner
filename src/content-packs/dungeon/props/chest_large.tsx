import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonChestLargeAsset = createDungeonAsset({
  id: 'dungeon.props_chest_large',
  slug: 'dungeon-props-chest-large',
  name: 'Dungeon Chest Large',
  category: 'prop',
  modelName: 'chest_large',
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
