import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1.6, 1.6, 1.6],
} satisfies KayKitTransform

export const kaykitForestRock3AAsset = createKayKitAsset({
  id: 'kaykit.forest_rock_3_a',
  slug: 'kaykit-forest-rock-3-a',
  name: 'KayKit Forest Rock C',
  category: 'prop',
  modelName: 'Rock_3_A_Color1',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: true,
  },
})
