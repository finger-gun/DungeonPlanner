import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStairsWideAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_wide',
  slug: 'dungeon-stairs-stairs-wide',
  name: 'Dungeon Stairs Wide',
  category: 'opening',
  modelName: 'stairs_wide',
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
