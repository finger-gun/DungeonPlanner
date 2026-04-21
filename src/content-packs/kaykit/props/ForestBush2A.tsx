import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1.4, 1.4, 1.4],
} satisfies KayKitTransform

export const kaykitForestBush2AAsset = createKayKitAsset({
  id: 'kaykit.forest_bush_2_a',
  slug: 'kaykit-forest-bush-2-a',
  name: 'KayKit Forest Bush B',
  category: 'prop',
  modelName: 'Bush_2_A_Color1',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
