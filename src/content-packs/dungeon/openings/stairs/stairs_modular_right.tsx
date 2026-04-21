import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStairsModularRightAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_modular_right',
  slug: 'dungeon-stairs-stairs-modular-right',
  name: 'Dungeon Stairs Modular Right',
  category: 'opening',
  modelName: 'stairs_modular_right',
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
