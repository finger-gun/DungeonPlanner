import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStairsWallLeftAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_wall_left',
  slug: 'dungeon-stairs-stairs-wall-left',
  name: 'Dungeon Stairs Wall Left',
  category: 'opening',
  modelName: 'stairs_wall_left',
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
