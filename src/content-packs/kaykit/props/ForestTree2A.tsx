import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [2.8, 2.8, 2.8],
} satisfies KayKitTransform

export const kaykitForestTree2AAsset = createKayKitAsset({
  id: 'kaykit.forest_tree_2_a',
  slug: 'kaykit-forest-tree-2-a',
  name: 'KayKit Forest Tree B',
  category: 'prop',
  modelName: 'Tree_2_A_Color1',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: true,
  },
})
