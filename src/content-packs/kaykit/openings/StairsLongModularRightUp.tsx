import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsLongModularRightUpAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_long_modular_right_up',
  slug: 'kaykit-opening-stairs_long_modular_right-up',
  name: 'KayKit Stairs Long Modular Right Up',
  category: 'opening',
  modelName: 'stairs_long_modular_right',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'up',
    pairedAssetId: 'kaykit.opening_stairs_long_modular_right_down',
  },
})
