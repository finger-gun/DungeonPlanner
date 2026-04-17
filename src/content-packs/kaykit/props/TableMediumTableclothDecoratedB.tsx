import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitTableMediumTableclothDecoratedBAsset = createKayKitAsset({
  id: 'kaykit.props_table_medium_tablecloth_decorated_b',
  slug: 'kaykit-props-table-medium-tablecloth-decorated-b',
  name: 'KayKit Medium Table Tablecloth Decorated B',
  category: 'prop',
  modelName: 'table_medium_tablecloth_decorated_B',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
