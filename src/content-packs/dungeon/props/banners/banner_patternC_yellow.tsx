import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatterncYellowAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternC_yellow',
  slug: 'dungeon-props-banners-banner-patternC-yellow',
  name: 'Dungeon Banner Patternc Yellow',
  category: 'prop',
  modelName: 'banner_patternC_yellow',
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
