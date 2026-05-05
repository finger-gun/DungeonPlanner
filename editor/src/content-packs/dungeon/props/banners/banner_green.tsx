import { createGenericColorSwatch } from '../../shared/dungeonColorAtlas'
import {
  ALL_PLAIN_BANNER_SWATCHES,
  BANNER_WALL_CONNECTORS,
  PLAIN_BANNER_DEFAULT_SOURCE_CELLS,
} from './bannerColorVariants'

export const dungeonBannerGreenAsset = createGenericColorSwatch({
  id: 'dungeon.props_banners_banner_green',
  slug: 'dungeon-props-banners-banner-green',
  name: 'Dungeon Banner Green',
  modelName: 'banner_green',
  sourceCells: [PLAIN_BANNER_DEFAULT_SOURCE_CELLS.green],
  variants: ALL_PLAIN_BANNER_SWATCHES,
  defaultVariantId: 'green',
  metadata: {
    snapsTo: 'GRID',
    connectors: BANNER_WALL_CONNECTORS,
    blocksLineOfSight: false,
  },
})
