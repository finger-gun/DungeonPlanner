import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'

export const dungeonTrunkLargeAAsset = createGenericColorSwatch({
  id: 'dungeon.props_trunk_large_A',
  slug: 'dungeon-props-trunk-large-A',
  name: 'Dungeon Trunk Large A',
  modelName: 'trunk_large_A',
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
