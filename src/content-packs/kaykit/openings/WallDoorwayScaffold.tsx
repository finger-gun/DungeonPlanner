import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitWallDoorwayScaffoldAsset = createKayKitAsset({
  id: 'kaykit.opening_wall_doorway_scaffold',
  slug: 'kaykit-opening-wall-doorway-scaffold',
  name: 'KayKit Scaffold Doorway',
  category: 'opening',
  modelName: 'wall_doorway_scaffold',
  thumbnailName: 'wall',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
    openingWidth: 1,
  },
})
