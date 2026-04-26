import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStairsModularCenterAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_modular_center',
  slug: 'dungeon-stairs-stairs-modular-center',
  name: 'Dungeon Stairs Modular Center',
  category: 'opening',
  modelName: 'stairs_modular_center',
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
