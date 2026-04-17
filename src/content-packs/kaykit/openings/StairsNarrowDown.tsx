import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -2.1, -1] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStairsNarrowDownAsset = createKayKitAsset({
  id: 'kaykit.opening_stairs_narrow_down',
  slug: 'kaykit-opening-stairs_narrow-down',
  name: 'KayKit Stairs Narrow Down',
  category: 'opening',
  modelName: 'stairs_narrow',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    stairDirection: 'down',
    pairedAssetId: 'kaykit.opening_stairs_narrow_up',
  },
})
