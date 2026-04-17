import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsModularCenterUpAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_modular_center_up',
  slug: 'kaykit-opening-stairs_modular_center-up',
  name: 'KayKit Stairs Modular Center Up',
  category: 'opening',
  modelName: 'stairs_modular_center',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'up',
    pairedAssetId: 'kaykit.opening_stairs_modular_center_down',
  },
})
