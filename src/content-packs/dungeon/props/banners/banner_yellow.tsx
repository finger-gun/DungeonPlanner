import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerYellowAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_yellow',
  slug: 'dungeon-props-banners-banner-yellow',
  name: 'Dungeon Banner Yellow',
  category: 'prop',
  modelName: 'banner_yellow',
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
