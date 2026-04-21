import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerThinBrownAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_thin_brown',
  slug: 'dungeon-props-banners-banner-thin-brown',
  name: 'Dungeon Banner Thin Brown',
  category: 'prop',
  modelName: 'banner_thin_brown',
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
