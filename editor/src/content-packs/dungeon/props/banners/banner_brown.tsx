import { createGenericColorSwatch } from '../../shared/dungeonColorAtlas'
import {
  ALL_PLAIN_BANNER_SWATCHES,
  BANNER_WALL_CONNECTORS,
  PLAIN_BANNER_DEFAULT_SOURCE_CELLS,
} from './bannerColorVariants'

export const dungeonBannerBrownAsset = createGenericColorSwatch({
  id: 'dungeon.props_banners_banner_brown',
  slug: 'dungeon-props-banners-banner-brown',
  name: 'Dungeon Banner Brown',
  modelName: 'banner_brown',
  sourceCells: [PLAIN_BANNER_DEFAULT_SOURCE_CELLS.brown],
  variants: ALL_PLAIN_BANNER_SWATCHES,
  defaultVariantId: 'brown',
  metadata: {
    snapsTo: 'GRID',
    connectors: BANNER_WALL_CONNECTORS,
    blocksLineOfSight: false,
  },
})
