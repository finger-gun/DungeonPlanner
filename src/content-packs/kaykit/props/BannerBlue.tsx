import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitBannerBlueAsset = createKayKitAsset({
  id: 'kaykit.props_banner_blue',
  slug: 'kaykit-props-banner-blue',
  name: 'KayKit Blue Banner',
  category: 'prop',
  modelName: 'banner_blue',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
  },
})
