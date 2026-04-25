import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerTripleRedAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_triple_red',
  slug: 'dungeon-props-banners-banner-triple-red',
  name: 'Dungeon Banner Triple Red',
  category: 'prop',
  modelName: 'banner_triple_red',
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
