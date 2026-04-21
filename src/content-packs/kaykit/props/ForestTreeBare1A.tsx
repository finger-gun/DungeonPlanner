import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [3.2, 3.2, 3.2],
} satisfies KayKitTransform

export const kaykitForestTreeBare1AAsset = createKayKitAsset({
  id: 'kaykit.forest_tree_bare_1_a',
  slug: 'kaykit-forest-tree-bare-1-a',
  name: 'KayKit Forest Bare Tree',
  category: 'prop',
  modelName: 'Tree_Bare_1_A_Color1',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: true,
  },
})
