import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerTripleBlueAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_triple_blue',
  slug: 'dungeon-props-banners-banner-triple-blue',
  name: 'Dungeon Banner Triple Blue',
  category: 'prop',
  modelName: 'banner_triple_blue',
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
