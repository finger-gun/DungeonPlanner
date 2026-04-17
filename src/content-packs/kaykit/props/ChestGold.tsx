import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitChestGoldAsset = createKayKitAsset({
  id: 'kaykit.props_chest_gold',
  slug: 'kaykit-props-chest-gold',
  name: 'KayKit Gold Chest',
  category: 'prop',
  modelName: 'chest_gold',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
