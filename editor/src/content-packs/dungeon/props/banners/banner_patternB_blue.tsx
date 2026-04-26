import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatternbBlueAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternB_blue',
  slug: 'dungeon-props-banners-banner-patternB-blue',
  name: 'Dungeon Banner Patternb Blue',
  category: 'prop',
  modelName: 'banner_patternB_blue',
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
