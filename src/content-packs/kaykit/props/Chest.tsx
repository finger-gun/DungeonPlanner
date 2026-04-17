import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitChestAsset = createKayKitAsset({
  id: 'kaykit.props_chest',
  slug: 'kaykit-props-chest',
  name: 'KayKit Chest',
  category: 'prop',
  modelName: 'chest',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
