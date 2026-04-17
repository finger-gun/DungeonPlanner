import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitBoxSmallAsset = createKayKitAsset({
  id: 'kaykit.props_box_small',
  slug: 'kaykit-props-box-small',
  name: 'KayKit Small Box',
  category: 'prop',
  modelName: 'box_small',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
