import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStairsWallRightAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_wall_right',
  slug: 'dungeon-stairs-stairs-wall-right',
  name: 'Dungeon Stairs Wall Right',
  category: 'opening',
  modelName: 'stairs_wall_right',
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
