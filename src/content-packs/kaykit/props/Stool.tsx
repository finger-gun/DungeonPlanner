import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitStoolAsset = createKayKitAsset({
  id: 'kaykit.props_stool',
  slug: 'kaykit-props-stool',
  name: 'KayKit Stool',
  category: 'prop',
  modelName: 'stool',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
