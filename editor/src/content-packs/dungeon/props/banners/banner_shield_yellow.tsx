import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerShieldYellowAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_shield_yellow',
  slug: 'dungeon-props-banners-banner-shield-yellow',
  name: 'Dungeon Banner Shield Yellow',
  category: 'prop',
  modelName: 'banner_shield_yellow',
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
