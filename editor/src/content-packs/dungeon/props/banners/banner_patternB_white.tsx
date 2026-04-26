import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatternbWhiteAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternB_white',
  slug: 'dungeon-props-banners-banner-patternB-white',
  name: 'Dungeon Banner Patternb White',
  category: 'prop',
  modelName: 'banner_patternB_white',
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
