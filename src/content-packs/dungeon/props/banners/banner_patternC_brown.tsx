import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatterncBrownAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternC_brown',
  slug: 'dungeon-props-banners-banner-patternC-brown',
  name: 'Dungeon Banner Patternc Brown',
  category: 'prop',
  modelName: 'banner_patternC_brown',
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
