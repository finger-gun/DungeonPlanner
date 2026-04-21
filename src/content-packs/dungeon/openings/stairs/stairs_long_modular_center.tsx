import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStairsLongModularCenterAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_long_modular_center',
  slug: 'dungeon-stairs-stairs-long-modular-center',
  name: 'Dungeon Stairs Long Modular Center',
  category: 'opening',
  modelName: 'stairs_long_modular_center',
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
