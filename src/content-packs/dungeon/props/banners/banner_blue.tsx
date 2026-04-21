import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerBlueAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_blue',
  slug: 'dungeon-props-banners-banner-blue',
  name: 'Dungeon Banner Blue',
  category: 'prop',
  modelName: 'banner_blue',
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
