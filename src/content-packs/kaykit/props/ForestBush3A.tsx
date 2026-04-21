import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1.4, 1.4, 1.4],
} satisfies KayKitTransform

export const kaykitForestBush3AAsset = createKayKitAsset({
  id: 'kaykit.forest_bush_3_a',
  slug: 'kaykit-forest-bush-3-a',
  name: 'KayKit Forest Bush C',
  category: 'prop',
  modelName: 'Bush_3_A_Color1',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
