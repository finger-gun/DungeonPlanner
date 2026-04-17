import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitWallShelvesAsset = createKayKitAsset({
  id: 'kaykit.props_wall_shelves',
  slug: 'kaykit-props-wall-shelves',
  name: 'KayKit Wall Shelves',
  category: 'prop',
  modelName: 'wall_shelves',
  transform: ASSET_TRANSFORM,
  metadata: {
    propSurface: true,
    connectsTo: 'WALL',
  },
})
