import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -1.5, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsDownAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_down',
  slug: 'kaykit-opening-stairs-down',
  name: 'KayKit Stairs Down',
  category: 'opening',
  modelName: 'stairs',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
    pairedAssetId: 'kaykit.opening_stairs_up',
  },
})
