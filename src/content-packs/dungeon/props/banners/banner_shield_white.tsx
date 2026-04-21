import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerShieldWhiteAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_shield_white',
  slug: 'dungeon-props-banners-banner-shield-white',
  name: 'Dungeon Banner Shield White',
  category: 'prop',
  modelName: 'banner_shield_white',
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
