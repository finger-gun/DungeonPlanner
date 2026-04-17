import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitBoxLargeAsset = createKayKitAsset({
  id: 'kaykit.props_box_large',
  slug: 'kaykit-props-box-large',
  name: 'KayKit Large Box',
  category: 'prop',
  modelName: 'box_large',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FREE',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
