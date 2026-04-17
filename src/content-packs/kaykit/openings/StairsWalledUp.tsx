import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, -0.75] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsWalledUpAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_walled_up',
  slug: 'kaykit-opening-stairs_walled-up',
  name: 'KayKit Stairs Walled Up',
  category: 'opening',
  modelName: 'stairs_walled',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'up',
    pairedAssetId: 'kaykit.opening_stairs_walled_down',
  },
})
