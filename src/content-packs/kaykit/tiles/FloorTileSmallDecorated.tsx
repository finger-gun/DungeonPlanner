import { KAYKIT_BASE_SCALE, createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -0.05, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE],
} satisfies KayKitTransform

export const kaykitFloorTileSmallDecoratedAsset = createKayKitAsset({
  id: 'kaykit.floor_tile_small_decorated',
  slug: 'kaykit-floor-tile-small-decorated',
  name: 'KayKit Stone Floor Decorated',
  category: 'floor',
  modelName: 'floor_tile_small_decorated',
  transform: ASSET_TRANSFORM,
})
