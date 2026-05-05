import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'

export const dungeonTrunkMediumAAsset = createGenericColorSwatch({
  id: 'dungeon.props_trunk_medium_A',
  slug: 'dungeon-props-trunk-medium-A',
  name: 'Dungeon Trunk Medium A',
  modelName: 'trunk_medium_A',
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
