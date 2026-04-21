import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerTripleGreenAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_triple_green',
  slug: 'dungeon-props-banners-banner-triple-green',
  name: 'Dungeon Banner Triple Green',
  category: 'prop',
  modelName: 'banner_triple_green',
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
