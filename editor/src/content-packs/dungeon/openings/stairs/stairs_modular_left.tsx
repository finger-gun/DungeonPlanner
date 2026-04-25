import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStairsModularLeftAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_modular_left',
  slug: 'dungeon-stairs-stairs-modular-left',
  name: 'Dungeon Stairs Modular Left',
  category: 'opening',
  modelName: 'stairs_modular_left',
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
