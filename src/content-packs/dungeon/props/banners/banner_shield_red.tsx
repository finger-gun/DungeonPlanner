import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerShieldRedAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_shield_red',
  slug: 'dungeon-props-banners-banner-shield-red',
  name: 'Dungeon Banner Shield Red',
  category: 'prop',
  modelName: 'banner_shield_red',
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
