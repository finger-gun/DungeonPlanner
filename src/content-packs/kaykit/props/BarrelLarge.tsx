import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitBarrelLargeAsset = createKayKitAsset({
  id: 'kaykit.props_barrel_large',
  slug: 'kaykit-props-barrel-large',
  name: 'KayKit Large Barrel',
  category: 'prop',
  modelName: 'barrel_large',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
