import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatterncGreenAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternC_green',
  slug: 'dungeon-props-banners-banner-patternC-green',
  name: 'Dungeon Banner Patternc Green',
  category: 'prop',
  modelName: 'banner_patternC_green',
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
