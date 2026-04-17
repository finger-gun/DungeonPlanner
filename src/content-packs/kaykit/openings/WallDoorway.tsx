import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitWallDoorwayAsset = createKayKitAsset({
  id: 'kaykit.opening_wall_doorway',
  slug: 'kaykit-opening-wall-doorway',
  name: 'KayKit Doorway',
  category: 'opening',
  modelName: 'wall_doorway',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
    openingWidth: 1,
  },
})
