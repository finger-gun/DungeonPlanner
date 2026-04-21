import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatternaRedAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternA_red',
  slug: 'dungeon-props-banners-banner-patternA-red',
  name: 'Dungeon Banner Patterna Red',
  category: 'prop',
  modelName: 'banner_patternA_red',
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
