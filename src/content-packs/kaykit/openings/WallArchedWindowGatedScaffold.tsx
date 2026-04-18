import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitWallArchedWindowGatedScaffoldAsset = createKayKitAsset({
  id: 'kaykit.opening_wall_archedwindow_gated_scaffold',
  slug: 'kaykit-opening-wall-archedwindow-gated-scaffold',
  name: 'KayKit Scaffold Gated Arched Window',
  category: 'opening',
  modelName: 'wall_archedwindow_gated_scaffold',
  thumbnailName: 'wall',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
    openingWidth: 1,
  },
})
