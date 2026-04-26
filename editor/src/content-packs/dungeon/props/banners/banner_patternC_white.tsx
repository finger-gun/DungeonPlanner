import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatterncWhiteAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternC_white',
  slug: 'dungeon-props-banners-banner-patternC-white',
  name: 'Dungeon Banner Patternc White',
  category: 'prop',
  modelName: 'banner_patternC_white',
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
