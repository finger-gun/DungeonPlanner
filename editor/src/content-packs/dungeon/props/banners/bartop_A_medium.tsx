import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBartopAMediumAsset = createDungeonAsset({
  id: 'dungeon.props_banners_bartop_A_medium',
  slug: 'dungeon-props-banners-bartop-A-medium',
  name: 'Dungeon Bartop A Medium',
  category: 'prop',
  modelName: 'bartop_A_medium',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectors: [
      {
        point: [0, 0, 0],
        type: 'WALL',
      },
    ],
    blocksLineOfSight: false,
  },
})
