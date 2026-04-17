import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitTableMediumAsset = createKayKitAsset({
  id: 'kaykit.props_table_medium',
  slug: 'kaykit-props-table-medium',
  name: 'KayKit Medium Table',
  category: 'prop',
  modelName: 'table_medium',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
