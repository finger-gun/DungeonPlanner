import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonChestMimicAsset = createDungeonAsset({
  id: 'dungeon.props_chest_mimic',
  slug: 'dungeon-props-chest-mimic',
  name: 'Dungeon Chest Mimic',
  category: 'prop',
  modelName: 'chest_mimic',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    blocksLineOfSight: false,
  },
})
