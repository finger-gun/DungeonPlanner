import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStairsLongAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_long',
  slug: 'dungeon-stairs-stairs-long',
  name: 'Dungeon Stairs Long',
  category: 'opening',
  modelName: 'stairs_long',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
  },
})
