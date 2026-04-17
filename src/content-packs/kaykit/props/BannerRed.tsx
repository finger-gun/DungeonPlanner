import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitBannerRedAsset = createKayKitAsset({
  id: 'kaykit.props_banner_red',
  slug: 'kaykit-props-banner-red',
  name: 'KayKit Red Banner',
  category: 'prop',
  modelName: 'banner_red',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
  },
})
