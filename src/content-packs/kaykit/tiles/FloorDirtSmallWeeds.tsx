import { KAYKIT_BASE_SCALE, createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -0.05, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE],
} satisfies KayKitTransform

export const kaykitFloorDirtSmallWeedsAsset = createKayKitAsset({
  id: 'kaykit.floor_dirt_small_weeds',
  slug: 'kaykit-floor-dirt-small-weeds',
  name: 'KayKit Dirt Floor Weeds',
  category: 'floor',
  modelName: 'floor_dirt_small_weeds',
  transform: ASSET_TRANSFORM,
})
