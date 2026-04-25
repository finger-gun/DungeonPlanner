import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatternaWhiteAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternA_white',
  slug: 'dungeon-props-banners-banner-patternA-white',
  name: 'Dungeon Banner Patterna White',
  category: 'prop',
  modelName: 'banner_patternA_white',
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
