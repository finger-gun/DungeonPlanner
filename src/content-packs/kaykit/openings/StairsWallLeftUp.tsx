import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsWallLeftUpAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_wall_left_up',
  slug: 'kaykit-opening-stairs_wall_left-up',
  name: 'KayKit Stairs Wall Left Up',
  category: 'opening',
  modelName: 'stairs_wall_left',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'up',
    pairedAssetId: 'kaykit.opening_stairs_wall_left_down',
  },
})
