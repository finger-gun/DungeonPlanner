import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonPickaxeAsset = createDungeonAsset({
  id: 'dungeon.props_pickaxe',
  slug: 'dungeon-props-pickaxe',
  name: 'Dungeon Pickaxe',
  category: 'prop',
  modelName: 'pickaxe',
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
