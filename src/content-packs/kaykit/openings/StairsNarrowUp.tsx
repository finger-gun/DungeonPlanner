import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, -1] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsNarrowUpAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_narrow_up',
  slug: 'kaykit-opening-stairs_narrow-up',
  name: 'KayKit Stairs Narrow Up',
  category: 'opening',
  modelName: 'stairs_narrow',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'up',
    pairedAssetId: 'kaykit.opening_stairs_narrow_down',
  },
})
