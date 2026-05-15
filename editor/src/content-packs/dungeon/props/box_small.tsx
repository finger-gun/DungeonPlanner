import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'

export const dungeonBoxSmallAsset = createGenericColorSwatch({
  id: 'dungeon.props_box_small',
  slug: 'dungeon-props-box-small',
  name: 'Dungeon Box Small',
  modelName: 'box_small',
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
