import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStairsAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs',
  slug: 'dungeon-stairs-stairs',
  name: 'Dungeon Stairs',
  category: 'opening',
  modelName: 'stairs',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
  },
})
