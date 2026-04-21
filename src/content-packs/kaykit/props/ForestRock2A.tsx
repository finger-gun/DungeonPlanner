import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1.6, 1.6, 1.6],
} satisfies KayKitTransform

export const kaykitForestRock2AAsset = createKayKitAsset({
  id: 'kaykit.forest_rock_2_a',
  slug: 'kaykit-forest-rock-2-a',
  name: 'KayKit Forest Rock B',
  category: 'prop',
  modelName: 'Rock_2_A_Color1',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: true,
  },
})
