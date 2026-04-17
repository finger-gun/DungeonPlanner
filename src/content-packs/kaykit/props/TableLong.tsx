import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitTableLongAsset = createKayKitAsset({
  id: 'kaykit.props_table_long',
  slug: 'kaykit-props-table-long',
  name: 'KayKit Long Table',
  category: 'prop',
  modelName: 'table_long',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
