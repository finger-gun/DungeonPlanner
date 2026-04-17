import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -2.1, -1] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsWalledDownAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_walled_down',
  slug: 'kaykit-opening-stairs_walled-down',
  name: 'KayKit Stairs Walled Down',
  category: 'opening',
  modelName: 'stairs_walled',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
    pairedAssetId: 'kaykit.opening_stairs_walled_up',
  },
})
