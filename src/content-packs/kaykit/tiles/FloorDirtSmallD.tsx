import { KAYKIT_BASE_SCALE, createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -0.05, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE],
} satisfies KayKitTransform

export const kaykitFloorDirtSmallDAsset = createKayKitAsset({
  id: 'kaykit.floor_dirt_small_d',
  slug: 'kaykit-floor-dirt-small-d',
  name: 'KayKit Dirt Floor D',
  category: 'floor',
  modelName: 'floor_dirt_small_D',
  transform: ASSET_TRANSFORM,
})
