import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBartopBSmallAsset = createDungeonAsset({
  id: 'dungeon.props_banners_bartop_B_small',
  slug: 'dungeon-props-banners-bartop-B-small',
  name: 'Dungeon Bartop B Small',
  category: 'prop',
  modelName: 'bartop_B_small',
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
