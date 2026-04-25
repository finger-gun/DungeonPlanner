import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerTripleYellowAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_triple_yellow',
  slug: 'dungeon-props-banners-banner-triple-yellow',
  name: 'Dungeon Banner Triple Yellow',
  category: 'prop',
  modelName: 'banner_triple_yellow',
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
