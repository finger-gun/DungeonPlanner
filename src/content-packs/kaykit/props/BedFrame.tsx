import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitBedFrameAsset = createKayKitAsset({
  id: 'kaykit.props_bed_frame',
  slug: 'kaykit-props-bed-frame',
  name: 'KayKit Bed Frame',
  category: 'prop',
  modelName: 'bed_frame',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
