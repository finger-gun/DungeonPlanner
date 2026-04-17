import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitTableLongBrokenAsset = createKayKitAsset({
  id: 'kaykit.props_table_long_broken',
  slug: 'kaykit-props-table-long-broken',
  name: 'KayKit Long Table Broken',
  category: 'prop',
  modelName: 'table_long_broken',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
