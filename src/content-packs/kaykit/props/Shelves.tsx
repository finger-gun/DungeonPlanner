import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitShelvesAsset = createKayKitAsset({
  id: 'kaykit.props_shelves',
  slug: 'kaykit-props-shelves',
  name: 'KayKit Shelves',
  category: 'prop',
  modelName: 'shelves',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
    blocksLineOfSight: false,
  },
})
