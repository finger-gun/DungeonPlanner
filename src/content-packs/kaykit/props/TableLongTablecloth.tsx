import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitTableLongTableclothAsset = createKayKitAsset({
  id: 'kaykit.props_table_long_tablecloth',
  slug: 'kaykit-props-table-long-tablecloth',
  name: 'KayKit Long Table Tablecloth',
  category: 'prop',
  modelName: 'table_long_tablecloth',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
