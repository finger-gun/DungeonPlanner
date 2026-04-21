import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBartopBMediumAsset = createDungeonAsset({
  id: 'dungeon.props_banners_bartop_B_medium',
  slug: 'dungeon-props-banners-bartop-B-medium',
  name: 'Dungeon Bartop B Medium',
  category: 'prop',
  modelName: 'bartop_B_medium',
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
