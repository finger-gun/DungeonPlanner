import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatterncBlueAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternC_blue',
  slug: 'dungeon-props-banners-banner-patternC-blue',
  name: 'Dungeon Banner Patternc Blue',
  category: 'prop',
  modelName: 'banner_patternC_blue',
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
