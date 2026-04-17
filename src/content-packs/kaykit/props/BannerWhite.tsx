import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitBannerWhiteAsset = createKayKitAsset({
  id: 'kaykit.props_banner_white',
  slug: 'kaykit-props-banner-white',
  name: 'KayKit White Banner',
  category: 'prop',
  modelName: 'banner_white',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
  },
})
