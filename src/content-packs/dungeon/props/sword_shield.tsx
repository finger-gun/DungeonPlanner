import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonSwordShieldAsset = createDungeonAsset({
  id: 'dungeon.props_sword_shield',
  slug: 'dungeon-props-sword-shield',
  name: 'Dungeon Sword Shield',
  category: 'prop',
  modelName: 'sword_shield',
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
