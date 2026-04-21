import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatternbYellowAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternB_yellow',
  slug: 'dungeon-props-banners-banner-patternB-yellow',
  name: 'Dungeon Banner Patternb Yellow',
  category: 'prop',
  modelName: 'banner_patternB_yellow',
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
