import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitWallWindowClosedScaffoldAsset = createKayKitAsset({
  id: 'kaykit.opening_wall_window_closed_scaffold',
  slug: 'kaykit-opening-wall-window-closed-scaffold',
  name: 'KayKit Scaffold Closed Window',
  category: 'opening',
  modelName: 'wall_window_closed_scaffold',
  thumbnailName: 'wall_window_closed',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
    openingWidth: 1,
  },
})
