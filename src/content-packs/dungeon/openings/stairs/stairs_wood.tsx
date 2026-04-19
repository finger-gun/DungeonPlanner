import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStairsWoodAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_wood',
  slug: 'dungeon-stairs-stairs-wood',
  name: 'Dungeon Stairs Wood',
  category: 'opening',
  modelName: 'stairs_wood',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
  },
})
