import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, -1] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 0.9, 1],
} satisfies KayKitTransform

export const kaykitStairsLongUpAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_long_up',
  slug: 'kaykit-opening-stairs_long-up',
  name: 'KayKit Stairs Long Up',
  category: 'opening',
  modelName: 'stairs_long',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'up',
    pairedAssetId: 'kaykit.opening_stairs_long_down',
  },
})
