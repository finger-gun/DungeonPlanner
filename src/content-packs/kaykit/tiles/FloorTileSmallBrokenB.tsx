import { KAYKIT_BASE_SCALE, createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -0.05, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE],
} satisfies KayKitTransform

export const kaykitFloorTileSmallBrokenBAsset = createKayKitAsset({
  id: 'kaykit.floor_tile_small_broken_b',
  slug: 'kaykit-floor-tile-small-broken-b',
  name: 'KayKit Stone Floor Broken B',
  category: 'floor',
  modelName: 'floor_tile_small_broken_B',
  transform: ASSET_TRANSFORM,
})
