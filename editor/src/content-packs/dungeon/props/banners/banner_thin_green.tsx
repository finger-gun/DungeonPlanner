import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerThinGreenAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_thin_green',
  slug: 'dungeon-props-banners-banner-thin-green',
  name: 'Dungeon Banner Thin Green',
  category: 'prop',
  modelName: 'banner_thin_green',
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
