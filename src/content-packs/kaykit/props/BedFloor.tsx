import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitBedFloorAsset = createKayKitAsset({
  id: 'kaykit.props_bed_floor',
  slug: 'kaykit-props-bed-floor',
  name: 'KayKit Bed Floor',
  category: 'prop',
  modelName: 'bed_floor',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
