import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitTableLongDecoratedCAsset = createKayKitAsset({
  id: 'kaykit.props_table_long_decorated_c',
  slug: 'kaykit-props-table-long-decorated-c',
  name: 'KayKit Long Table Decorated C',
  category: 'prop',
  modelName: 'table_long_decorated_C',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
