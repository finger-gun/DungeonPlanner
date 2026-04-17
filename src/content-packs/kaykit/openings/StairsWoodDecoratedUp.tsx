import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsWoodDecoratedUpAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_wood_decorated_up',
  slug: 'kaykit-opening-stairs_wood_decorated-up',
  name: 'KayKit Stairs Wood Decorated Up',
  category: 'opening',
  modelName: 'stairs_wood_decorated',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'up',
    pairedAssetId: 'kaykit.opening_stairs_wood_decorated_down',
  },
})
