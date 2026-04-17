import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitTableMediumBrokenAsset = createKayKitAsset({
  id: 'kaykit.props_table_medium_broken',
  slug: 'kaykit-props-table-medium-broken',
  name: 'KayKit Medium Table Broken',
  category: 'prop',
  modelName: 'table_medium_broken',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
