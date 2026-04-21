import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerPatternbGreenAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_patternB_green',
  slug: 'dungeon-props-banners-banner-patternB-green',
  name: 'Dungeon Banner Patternb Green',
  category: 'prop',
  modelName: 'banner_patternB_green',
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
