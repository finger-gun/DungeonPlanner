import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsWideUpAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_wide_up',
  slug: 'kaykit-opening-stairs_wide-up',
  name: 'KayKit Stairs Wide Up',
  category: 'opening',
  modelName: 'stairs_wide',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'up',
    pairedAssetId: 'kaykit.opening_stairs_wide_down',
  },
})
