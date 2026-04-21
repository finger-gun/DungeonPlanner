import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatternbRedAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternB_red',
  slug: 'dungeon-props-banners-banner-patternB-red',
  name: 'Dungeon Banner Patternb Red',
  category: 'prop',
  modelName: 'banner_patternB_red',
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
