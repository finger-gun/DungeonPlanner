import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitPillarAsset = createKayKitAsset({
  id: 'kaykit.props_pillar',
  slug: 'kaykit-props-pillar',
  name: 'KayKit Pillar',
  category: 'prop',
  modelName: 'pillar',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
