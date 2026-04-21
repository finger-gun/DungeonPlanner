import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerGreenAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_green',
  slug: 'dungeon-props-banners-banner-green',
  name: 'Dungeon Banner Green',
  category: 'prop',
  modelName: 'banner_green',
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
