import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitChairAsset = createKayKitAsset({
  id: 'kaykit.props_chair',
  slug: 'kaykit-props-chair',
  name: 'KayKit Chair',
  category: 'prop',
  modelName: 'chair',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FREE',
    blocksLineOfSight: false,
  },
})
