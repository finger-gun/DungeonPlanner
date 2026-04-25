import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonSwordShieldGoldAsset = createDungeonAsset({
  id: 'dungeon.props_sword_shield_gold',
  slug: 'dungeon-props-sword-shield-gold',
  name: 'Dungeon Sword Shield Gold',
  category: 'prop',
  modelName: 'sword_shield_gold',
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
