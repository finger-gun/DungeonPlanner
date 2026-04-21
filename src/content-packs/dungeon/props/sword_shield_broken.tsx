import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonSwordShieldBrokenAsset = createDungeonAsset({
  id: 'dungeon.props_sword_shield_broken',
  slug: 'dungeon-props-sword-shield-broken',
  name: 'Dungeon Sword Shield Broken',
  category: 'prop',
  modelName: 'sword_shield_broken',
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
