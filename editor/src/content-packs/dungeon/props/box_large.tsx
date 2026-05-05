import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'

export const dungeonBoxLargeAsset = createGenericColorSwatch({
  id: 'dungeon.props_box_large',
  slug: 'dungeon-props-box-large',
  name: 'Dungeon Box Large',
  modelName: 'box_large',
  sourceCells: [[4, 0]],
  variants: DUNGEON_COLOR_SWATCHES,
  defaultVariantId: 'orange',
  metadata: {
    snapsTo: 'FREE',
    propSurface: true,
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
      {
        point: [0, 0, 0],
        type: 'SURFACE',
      },
    ],
    blocksLineOfSight: false,
  },
})
