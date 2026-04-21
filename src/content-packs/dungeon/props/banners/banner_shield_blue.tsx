import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerShieldBlueAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_shield_blue',
  slug: 'dungeon-props-banners-banner-shield-blue',
  name: 'Dungeon Banner Shield Blue',
  category: 'prop',
  modelName: 'banner_shield_blue',
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
