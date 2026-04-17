import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitShelfLargeAsset = createKayKitAsset({
  id: 'kaykit.props_shelf_large',
  slug: 'kaykit-props-shelf-large',
  name: 'KayKit Large Shelf',
  category: 'prop',
  modelName: 'shelf_large',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
