import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatternaYellowAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternA_yellow',
  slug: 'dungeon-props-banners-banner-patternA-yellow',
  name: 'Dungeon Banner Patterna Yellow',
  category: 'prop',
  modelName: 'banner_patternA_yellow',
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
