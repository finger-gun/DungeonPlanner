import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'

export const dungeonTrunkSmallAAsset = createGenericColorSwatch({
  id: 'dungeon.props_trunk_small_A',
  slug: 'dungeon-props-trunk-small-A',
  name: 'Dungeon Trunk Small A',
  modelName: 'trunk_small_A',
  sourceCells: [[4, 0]],
  variants: DUNGEON_COLOR_SWATCHES,
  defaultVariantId: 'orange',
  metadata: {
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    blocksLineOfSight: false,
  },
})
