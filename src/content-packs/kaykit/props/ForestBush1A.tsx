import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1.4, 1.4, 1.4],
} satisfies KayKitTransform

export const kaykitForestBush1AAsset = createKayKitAsset({
  id: 'kaykit.forest_bush_1_a',
  slug: 'kaykit-forest-bush-1-a',
  name: 'KayKit Forest Bush A',
  category: 'prop',
  modelName: 'Bush_1_A_Color1',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
