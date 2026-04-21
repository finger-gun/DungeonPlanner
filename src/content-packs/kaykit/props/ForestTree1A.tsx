import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [3, 3, 3],
} satisfies KayKitTransform

export const kaykitForestTree1AAsset = createKayKitAsset({
  id: 'kaykit.forest_tree_1_a',
  slug: 'kaykit-forest-tree-1-a',
  name: 'KayKit Forest Tree A',
  category: 'prop',
  modelName: 'Tree_1_A_Color1',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: true,
  },
})
