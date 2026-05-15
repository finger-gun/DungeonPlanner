import { createGenericColorSwatch } from '../../shared/dungeonColorAtlas'
import {
  ALL_PLAIN_BANNER_SWATCHES,
  BANNER_WALL_CONNECTORS,
  PLAIN_BANNER_DEFAULT_SOURCE_CELLS,
} from './bannerColorVariants'

export const dungeonBannerYellowAsset = createGenericColorSwatch({
  id: 'dungeon.props_banners_banner_yellow',
  slug: 'dungeon-props-banners-banner-yellow',
  name: 'Dungeon Banner Yellow',
  modelName: 'banner_yellow',
  sourceCells: [PLAIN_BANNER_DEFAULT_SOURCE_CELLS.yellow],
  variants: ALL_PLAIN_BANNER_SWATCHES,
  defaultVariantId: 'yellow',
  metadata: {
    snapsTo: 'GRID',
    connectors: BANNER_WALL_CONNECTORS,
    blocksLineOfSight: false,
  },
})
