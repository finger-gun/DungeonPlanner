import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -1.5, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsWoodDecoratedDownAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_wood_decorated_down',
  slug: 'kaykit-opening-stairs_wood_decorated-down',
  name: 'KayKit Stairs Wood Decorated Down',
  category: 'opening',
  modelName: 'stairs_wood_decorated',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
    pairedAssetId: 'kaykit.opening_stairs_wood_decorated_up',
  },
})
