import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform

export const kaykitTableSmallDecoratedAAsset = createKayKitAsset({
  id: 'kaykit.props_table_small_decorated_a',
  slug: 'kaykit-props-table-small-decorated-a',
  name: 'KayKit Small Table Decorated A',
  category: 'prop',
  modelName: 'table_small_decorated_A',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    propSurface: true,
    blocksLineOfSight: false,
  },
})
