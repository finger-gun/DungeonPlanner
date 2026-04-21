import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerTripleBrownAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_triple_brown',
  slug: 'dungeon-props-banners-banner-triple-brown',
  name: 'Dungeon Banner Triple Brown',
  category: 'prop',
  modelName: 'banner_triple_brown',
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
