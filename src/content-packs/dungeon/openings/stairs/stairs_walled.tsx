import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStairsWalledAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_walled',
  slug: 'dungeon-stairs-stairs-walled',
  name: 'Dungeon Stairs Walled',
  category: 'opening',
  modelName: 'stairs_walled',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    stairDirection: 'down',
  },
})
