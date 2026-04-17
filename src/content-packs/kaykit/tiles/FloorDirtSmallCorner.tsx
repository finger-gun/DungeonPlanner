import { KAYKIT_BASE_SCALE, createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -0.05, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE],
} satisfies KayKitTransform

export const kaykitFloorDirtSmallCornerAsset = createKayKitAsset({
  id: 'kaykit.floor_dirt_small_corner',
  slug: 'kaykit-floor-dirt-small-corner',
  name: 'KayKit Dirt Floor Corner',
  category: 'floor',
  modelName: 'floor_dirt_small_corner',
  transform: ASSET_TRANSFORM,
})
