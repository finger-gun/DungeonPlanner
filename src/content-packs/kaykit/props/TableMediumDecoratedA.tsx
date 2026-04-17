import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitTableMediumDecoratedAAsset = createKayKitAsset({
  id: 'kaykit.props_table_medium_decorated_a',
  slug: 'kaykit-props-table-medium-decorated-a',
  name: 'KayKit Medium Table Decorated A',
  category: 'prop',
  modelName: 'table_medium_decorated_A',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
