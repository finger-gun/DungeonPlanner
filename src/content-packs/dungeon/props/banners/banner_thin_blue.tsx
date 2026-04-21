import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerThinBlueAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_thin_blue',
  slug: 'dungeon-props-banners-banner-thin-blue',
  name: 'Dungeon Banner Thin Blue',
  category: 'prop',
  modelName: 'banner_thin_blue',
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
