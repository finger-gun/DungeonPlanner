import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerShieldBrownAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_shield_brown',
  slug: 'dungeon-props-banners-banner-shield-brown',
  name: 'Dungeon Banner Shield Brown',
  category: 'prop',
  modelName: 'banner_shield_brown',
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
