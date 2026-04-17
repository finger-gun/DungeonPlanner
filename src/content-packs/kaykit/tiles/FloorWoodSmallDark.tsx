import { KAYKIT_BASE_SCALE, createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -0.05, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE],
} satisfies KayKitTransform

export const kaykitFloorWoodSmallDarkAsset = createKayKitAsset({
  id: 'kaykit.floor_wood_small_dark',
  slug: 'kaykit-floor-wood-small-dark',
  name: 'KayKit Wood Floor Dark',
  category: 'floor',
  modelName: 'floor_wood_small_dark',
  transform: ASSET_TRANSFORM,
})
