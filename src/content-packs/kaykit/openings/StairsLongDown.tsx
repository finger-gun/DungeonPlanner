import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -2, -1] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsLongDownAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_long_down',
  slug: 'kaykit-opening-stairs_long-down',
  name: 'KayKit Stairs Long Down',
  category: 'opening',
  modelName: 'stairs_long',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
    pairedAssetId: 'kaykit.opening_stairs_long_up',
  },
})
