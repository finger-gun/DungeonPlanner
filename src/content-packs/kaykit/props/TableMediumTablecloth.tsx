import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitTableMediumTableclothAsset = createKayKitAsset({
  id: 'kaykit.props_table_medium_tablecloth',
  slug: 'kaykit-props-table-medium-tablecloth',
  name: 'KayKit Medium Table Tablecloth',
  category: 'prop',
  modelName: 'table_medium_tablecloth',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
