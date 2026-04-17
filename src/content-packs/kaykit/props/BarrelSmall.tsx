import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitBarrelSmallAsset = createKayKitAsset({
  id: 'kaykit.props_barrel_small',
  slug: 'kaykit-props-barrel-small',
  name: 'KayKit Small Barrel',
  category: 'prop',
  modelName: 'barrel_small',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
