import { KAYKIT_BASE_SCALE, createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, -0.05, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE, 1 / KAYKIT_BASE_SCALE],
} satisfies KayKitTransform

export const kaykitFloorWoodSmallAsset = createKayKitAsset({
  id: 'kaykit.floor_wood_small',
  slug: 'kaykit-floor-wood-small',
  name: 'KayKit Wood Floor',
  category: 'floor',
  modelName: 'floor_wood_small',
  transform: ASSET_TRANSFORM,
})
