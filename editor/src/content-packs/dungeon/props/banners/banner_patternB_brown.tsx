import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatternbBrownAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternB_brown',
  slug: 'dungeon-props-banners-banner-patternB-brown',
  name: 'Dungeon Banner Patternb Brown',
  category: 'prop',
  modelName: 'banner_patternB_brown',
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
