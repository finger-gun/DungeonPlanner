import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitWallGatedAsset = createKayKitAsset({
  id: 'kaykit.opening_wall_gated',
  slug: 'kaykit-opening-wall-gated',
  name: 'KayKit Gated Opening',
  category: 'opening',
  modelName: 'wall_gated',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
    openingWidth: 1,
  },
})
