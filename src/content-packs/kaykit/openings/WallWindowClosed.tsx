import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitWallWindowClosedAsset = createKayKitAsset({
  id: 'kaykit.opening_wall_window_closed',
  slug: 'kaykit-opening-wall-window-closed',
  name: 'KayKit Closed Window',
  category: 'opening',
  modelName: 'wall_window_closed',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'WALL',
    openingWidth: 1,
  },
})
