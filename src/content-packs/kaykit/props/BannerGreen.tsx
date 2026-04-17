import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitBannerGreenAsset = createKayKitAsset({
  id: 'kaykit.props_banner_green',
  slug: 'kaykit-props-banner-green',
  name: 'KayKit Green Banner',
  category: 'prop',
  modelName: 'banner_green',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
  },
})
