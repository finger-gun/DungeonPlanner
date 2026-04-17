import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitBannerBrownAsset = createKayKitAsset({
  id: 'kaykit.props_banner_brown',
  slug: 'kaykit-props-banner-brown',
  name: 'KayKit Brown Banner',
  category: 'prop',
  modelName: 'banner_brown',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
  },
})
