import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsUpAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_up',
  slug: 'kaykit-opening-stairs-up',
  name: 'KayKit Stairs Up',
  category: 'opening',
  modelName: 'stairs',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'up',
    pairedAssetId: 'kaykit.opening_stairs_down',
  },
})
