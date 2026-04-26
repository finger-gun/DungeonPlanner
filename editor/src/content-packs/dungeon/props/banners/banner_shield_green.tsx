import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerShieldGreenAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_shield_green',
  slug: 'dungeon-props-banners-banner-shield-green',
  name: 'Dungeon Banner Shield Green',
  category: 'prop',
  modelName: 'banner_shield_green',
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
