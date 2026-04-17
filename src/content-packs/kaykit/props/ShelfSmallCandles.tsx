import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 1, 0.1] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform


export const kaykitShelfSmallCandlesAsset = createKayKitAsset({
  id: 'kaykit.props_shelf_small_candles',
  slug: 'kaykit-props-shelf-small-candles',
  name: 'KayKit Small Shelf Candles',
  category: 'prop',
  modelName: 'shelf_small_candles',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
    blocksLineOfSight: false,
  },
})
