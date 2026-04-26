import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBartopASmallAsset = createDungeonAsset({
  id: 'dungeon.props_banners_bartop_A_small',
  slug: 'dungeon-props-banners-bartop-A-small',
  name: 'Dungeon Bartop A Small',
  category: 'prop',
  modelName: 'bartop_A_small',
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
