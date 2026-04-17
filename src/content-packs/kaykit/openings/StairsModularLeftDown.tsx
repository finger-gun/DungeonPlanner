import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -1.5, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsModularLeftDownAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_modular_left_down',
  slug: 'kaykit-opening-stairs_modular_left-down',
  name: 'KayKit Stairs Modular Left Down',
  category: 'opening',
  modelName: 'stairs_modular_left',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
    pairedAssetId: 'kaykit.opening_stairs_modular_left_up',
  },
})
