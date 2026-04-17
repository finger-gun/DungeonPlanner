import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -1.5, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsWallRightDownAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_wall_right_down',
  slug: 'kaykit-opening-stairs_wall_right-down',
  name: 'KayKit Stairs Wall Right Down',
  category: 'opening',
  modelName: 'stairs_wall_right',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
    pairedAssetId: 'kaykit.opening_stairs_wall_right_up',
  },
})
