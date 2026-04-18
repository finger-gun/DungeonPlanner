import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitWallOpenScaffoldAsset = createKayKitAsset({
  id: 'kaykit.opening_wall_open_scaffold',
  slug: 'kaykit-opening-wall-open-scaffold',
  name: 'KayKit Open Scaffold Wall',
  category: 'opening',
  modelName: 'wall_open_scaffold',
  thumbnailName: 'wall',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
    openingWidth: 1,
  },
})
