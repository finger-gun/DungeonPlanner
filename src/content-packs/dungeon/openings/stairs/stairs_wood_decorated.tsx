import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStairsWoodDecoratedAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_wood_decorated',
  slug: 'dungeon-stairs-stairs-wood-decorated',
  name: 'Dungeon Stairs Wood Decorated',
  category: 'opening',
  modelName: 'stairs_wood_decorated',
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
