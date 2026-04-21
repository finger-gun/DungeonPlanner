import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1.6, 1.6, 1.6],
} satisfies KayKitTransform

export const kaykitForestRock1AAsset = createKayKitAsset({
  id: 'kaykit.forest_rock_1_a',
  slug: 'kaykit-forest-rock-1-a',
  name: 'KayKit Forest Rock A',
  category: 'prop',
  modelName: 'Rock_1_A_Color1',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: true,
  },
})
