import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitTableLongDecoratedAAsset = createKayKitAsset({
  id: 'kaykit.props_table_long_decorated_a',
  slug: 'kaykit-props-table-long-decorated-a',
  name: 'KayKit Long Table Decorated A',
  category: 'prop',
  modelName: 'table_long_decorated_A',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
