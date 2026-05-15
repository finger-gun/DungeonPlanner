import { createGenericColorSwatch } from '../../shared/dungeonColorAtlas'
import {
  ALL_PLAIN_BANNER_SWATCHES,
  BANNER_WALL_CONNECTORS,
  PLAIN_BANNER_DEFAULT_SOURCE_CELLS,
} from './bannerColorVariants'

export const dungeonBannerBlueAsset = createGenericColorSwatch({
  id: 'dungeon.props_banners_banner_blue',
  slug: 'dungeon-props-banners-banner-blue',
  name: 'Dungeon Banner Blue',
  modelName: 'banner_blue',
  sourceCells: [PLAIN_BANNER_DEFAULT_SOURCE_CELLS.blue],
  variants: ALL_PLAIN_BANNER_SWATCHES,
  defaultVariantId: 'blue',
  metadata: {
    snapsTo: 'GRID',
    connectors: BANNER_WALL_CONNECTORS,
    blocksLineOfSight: false,
  },
})
