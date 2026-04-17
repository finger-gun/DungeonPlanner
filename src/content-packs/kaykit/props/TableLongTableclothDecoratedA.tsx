import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitTableLongTableclothDecoratedAAsset = createKayKitAsset({
  id: 'kaykit.props_table_long_tablecloth_decorated_a',
  slug: 'kaykit-props-table-long-tablecloth-decorated-a',
  name: 'KayKit Long Table Tablecloth Decorated A',
  category: 'prop',
  modelName: 'table_long_tablecloth_decorated_A',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
