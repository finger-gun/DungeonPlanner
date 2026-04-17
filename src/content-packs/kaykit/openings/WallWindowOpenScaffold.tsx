import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitWallWindowOpenScaffoldAsset = createKayKitAsset({
  id: 'kaykit.opening_wall_window_open_scaffold',
  slug: 'kaykit-opening-wall-window-open-scaffold',
  name: 'KayKit Scaffold Open Window',
  category: 'opening',
  modelName: 'wall_window_open_scaffold',
  thumbnailName: 'wall_window_open',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
    openingWidth: 1,
  },
})
