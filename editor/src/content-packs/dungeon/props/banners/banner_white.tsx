import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerWhiteAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_white',
  slug: 'dungeon-props-banners-banner-white',
  name: 'Dungeon Banner White',
  category: 'prop',
  modelName: 'banner_white',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [
      {
        point: [0, 0, 0.5],
        type: 'WALL',
      },
    ],
    blocksLineOfSight: false,
  },
})
