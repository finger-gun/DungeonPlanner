import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, -0.8] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsWoodUpAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_wood_up',
  slug: 'kaykit-opening-stairs_wood-up',
  name: 'KayKit Stairs Wood Up',
  category: 'opening',
  modelName: 'stairs_wood',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'up',
    pairedAssetId: 'kaykit.opening_stairs_wood_down',
  },
})
