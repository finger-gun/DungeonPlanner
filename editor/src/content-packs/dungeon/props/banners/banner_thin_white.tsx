import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerThinWhiteAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_thin_white',
  slug: 'dungeon-props-banners-banner-thin-white',
  name: 'Dungeon Banner Thin White',
  category: 'prop',
  modelName: 'banner_thin_white',
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
