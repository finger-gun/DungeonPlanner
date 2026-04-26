import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatterncRedAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternC_red',
  slug: 'dungeon-props-banners-banner-patternC-red',
  name: 'Dungeon Banner Patternc Red',
  category: 'prop',
  modelName: 'banner_patternC_red',
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
