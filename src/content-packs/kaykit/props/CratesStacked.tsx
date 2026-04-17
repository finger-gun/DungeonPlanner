import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitCratesStackedAsset = createKayKitAsset({
  id: 'kaykit.props_crates_stacked',
  slug: 'kaykit-props-crates-stacked',
  name: 'KayKit Stacked Crates',
  category: 'prop',
  modelName: 'crates_stacked',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
