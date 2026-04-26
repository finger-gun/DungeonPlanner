import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStairsLongModularLeftAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_long_modular_left',
  slug: 'dungeon-stairs-stairs-long-modular-left',
  name: 'Dungeon Stairs Long Modular Left',
  category: 'opening',
  modelName: 'stairs_long_modular_left',
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
