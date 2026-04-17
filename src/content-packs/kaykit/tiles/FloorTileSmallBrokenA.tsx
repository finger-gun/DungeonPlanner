import { KAYKIT_BASE_SCALE, createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -0.05, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE],
} satisfies KayKitTransform

export const kaykitFloorTileSmallBrokenAAsset = createKayKitAsset({
  id: 'kaykit.floor_tile_small_broken_a',
  slug: 'kaykit-floor-tile-small-broken-a',
  name: 'KayKit Stone Floor Broken A',
  category: 'floor',
  modelName: 'floor_tile_small_broken_A',
  transform: ASSET_TRANSFORM,
})
