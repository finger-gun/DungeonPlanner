import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatternaBrownAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternA_brown',
  slug: 'dungeon-props-banners-banner-patternA-brown',
  name: 'Dungeon Banner Patterna Brown',
  category: 'prop',
  modelName: 'banner_patternA_brown',
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
