import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -1.5, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsWoodDownAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_wood_down',
  slug: 'kaykit-opening-stairs_wood-down',
  name: 'KayKit Stairs Wood Down',
  category: 'opening',
  modelName: 'stairs_wood',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
    pairedAssetId: 'kaykit.opening_stairs_wood_up',
  },
})
