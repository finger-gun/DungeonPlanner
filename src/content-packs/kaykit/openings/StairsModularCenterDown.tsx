import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -1.5, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsModularCenterDownAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_modular_center_down',
  slug: 'kaykit-opening-stairs_modular_center-down',
  name: 'KayKit Stairs Modular Center Down',
  category: 'opening',
  modelName: 'stairs_modular_center',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
    pairedAssetId: 'kaykit.opening_stairs_modular_center_up',
  },
})
