import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonPickaxeGoldAsset = createDungeonAsset({
  id: 'dungeon.props_pickaxe_gold',
  slug: 'dungeon-props-pickaxe-gold',
  name: 'Dungeon Pickaxe Gold',
  category: 'prop',
  modelName: 'pickaxe_gold',
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
