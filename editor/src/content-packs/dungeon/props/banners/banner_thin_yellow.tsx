import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerThinYellowAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_thin_yellow',
  slug: 'dungeon-props-banners-banner-thin-yellow',
  name: 'Dungeon Banner Thin Yellow',
  category: 'prop',
  modelName: 'banner_thin_yellow',
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
