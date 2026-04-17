import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitBannerYellowAsset = createKayKitAsset({
  id: 'kaykit.props_banner_yellow',
  slug: 'kaykit-props-banner-yellow',
  name: 'KayKit Yellow Banner',
  category: 'prop',
  modelName: 'banner_yellow',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
  },
})
