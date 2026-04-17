import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsLongModularLeftUpAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_long_modular_left_up',
  slug: 'kaykit-opening-stairs_long_modular_left-up',
  name: 'KayKit Stairs Long Modular Left Up',
  category: 'opening',
  modelName: 'stairs_long_modular_left',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'up',
    pairedAssetId: 'kaykit.opening_stairs_long_modular_left_down',
  },
})
