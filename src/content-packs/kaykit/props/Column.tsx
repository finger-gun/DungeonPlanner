import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitColumnAsset = createKayKitAsset({
  id: 'kaykit.props_column',
  slug: 'kaykit-props-column',
  name: 'KayKit Column',
  category: 'prop',
  modelName: 'column',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
