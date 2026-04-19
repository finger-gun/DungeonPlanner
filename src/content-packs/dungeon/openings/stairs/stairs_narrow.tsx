import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStairsNarrowAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_narrow',
  slug: 'dungeon-stairs-stairs-narrow',
  name: 'Dungeon Stairs Narrow',
  category: 'opening',
  modelName: 'stairs_narrow',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
  },
})
