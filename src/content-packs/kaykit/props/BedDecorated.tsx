import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitBedDecoratedAsset = createKayKitAsset({
  id: 'kaykit.props_bed_decorated',
  slug: 'kaykit-props-bed-decorated',
  name: 'KayKit Bed Decorated',
  category: 'prop',
  modelName: 'bed_decorated',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
