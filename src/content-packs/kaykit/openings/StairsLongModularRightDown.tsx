import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -1.5, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsLongModularRightDownAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_long_modular_right_down',
  slug: 'kaykit-opening-stairs_long_modular_right-down',
  name: 'KayKit Stairs Long Modular Right Down',
  category: 'opening',
  modelName: 'stairs_long_modular_right',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
    pairedAssetId: 'kaykit.opening_stairs_long_modular_right_up',
  },
})
