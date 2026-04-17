import { KAYKIT_BASE_SCALE, createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -0.05, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE],
} satisfies KayKitTransform

export const kaykitFloorTileSmallWeedsBAsset = createKayKitAsset({
  id: 'kaykit.floor_tile_small_weeds_b',
  slug: 'kaykit-floor-tile-small-weeds-b',
  name: 'KayKit Stone Floor Weeds B',
  category: 'floor',
  modelName: 'floor_tile_small_weeds_B',
  transform: ASSET_TRANSFORM,
})
