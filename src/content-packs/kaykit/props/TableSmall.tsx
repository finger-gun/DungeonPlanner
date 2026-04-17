import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitTableSmallAsset = createKayKitAsset({
  id: 'kaykit.props_table_small',
  slug: 'kaykit-props-table-small',
  name: 'KayKit Small Table',
  category: 'prop',
  modelName: 'table_small',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
