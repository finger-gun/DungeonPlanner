import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerThinRedAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_thin_red',
  slug: 'dungeon-props-banners-banner-thin-red',
  name: 'Dungeon Banner Thin Red',
  category: 'prop',
  modelName: 'banner_thin_red',
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
