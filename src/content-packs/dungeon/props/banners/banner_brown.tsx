import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerBrownAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_brown',
  slug: 'dungeon-props-banners-banner-brown',
  name: 'Dungeon Banner Brown',
  category: 'prop',
  modelName: 'banner_brown',
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
