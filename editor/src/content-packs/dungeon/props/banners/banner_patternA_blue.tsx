import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatternaBlueAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternA_blue',
  slug: 'dungeon-props-banners-banner-patternA-blue',
  name: 'Dungeon Banner Patterna Blue',
  category: 'prop',
  modelName: 'banner_patternA_blue',
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
