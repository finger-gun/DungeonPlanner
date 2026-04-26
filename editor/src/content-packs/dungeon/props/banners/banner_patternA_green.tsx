import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatternaGreenAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternA_green',
  slug: 'dungeon-props-banners-banner-patternA-green',
  name: 'Dungeon Banner Patterna Green',
  category: 'prop',
  modelName: 'banner_patternA_green',
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
