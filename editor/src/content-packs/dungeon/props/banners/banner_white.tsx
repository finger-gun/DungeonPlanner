import { createGenericColorSwatch } from '../../shared/dungeonColorAtlas'
import {
  ALL_PLAIN_BANNER_SWATCHES,
  BANNER_WALL_CONNECTORS,
  PLAIN_BANNER_DEFAULT_SOURCE_CELLS,
} from './bannerColorVariants'

export const dungeonBannerWhiteAsset = createGenericColorSwatch({
  id: 'dungeon.props_banners_banner_white',
  slug: 'dungeon-props-banners-banner-white',
  name: 'Dungeon Banner White',
  modelName: 'banner_white',
  sourceCells: [PLAIN_BANNER_DEFAULT_SOURCE_CELLS.white],
  variants: ALL_PLAIN_BANNER_SWATCHES,
  defaultVariantId: 'white',
  metadata: {
    snapsTo: 'GRID',
    connectors: BANNER_WALL_CONNECTORS,
    blocksLineOfSight: false,
  },
})
