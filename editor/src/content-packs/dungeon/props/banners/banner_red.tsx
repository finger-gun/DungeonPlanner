import { createGenericColorSwatch } from '../../shared/dungeonColorAtlas'
import {
  ALL_PLAIN_BANNER_SWATCHES,
  BANNER_WALL_CONNECTORS,
  PLAIN_BANNER_DEFAULT_SOURCE_CELLS,
} from './bannerColorVariants'

export const dungeonBannerRedAsset = createGenericColorSwatch({
  id: 'dungeon.props_banners_banner_red',
  slug: 'dungeon-props-banners-banner-red',
  name: 'Dungeon Banner Red',
  modelName: 'banner_red',
  sourceCells: [PLAIN_BANNER_DEFAULT_SOURCE_CELLS.red],
  variants: ALL_PLAIN_BANNER_SWATCHES,
  defaultVariantId: 'red',
  metadata: {
    snapsTo: 'GRID',
    connectors: BANNER_WALL_CONNECTORS,
    blocksLineOfSight: false,
  },
})
