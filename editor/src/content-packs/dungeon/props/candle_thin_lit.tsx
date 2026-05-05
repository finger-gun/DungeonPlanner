import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'

export const dungeonCandleThinLitAsset = createGenericColorSwatch({
  id: 'dungeon.props_candle_thin_lit',
  slug: 'dungeon-props-candle-thin-lit',
  name: 'Dungeon Candle Thin Lit',
  modelName: 'candle_thin_lit',
  sourceCells: [[0, 3]],
  variants: DUNGEON_COLOR_SWATCHES,
  defaultVariantId: 'ivory',
  metadata: {
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    blocksLineOfSight: false,
  },
  getLight: createDungeonFlameLightGetter({
    defaultLit: true,
    light: {
      intensity: 0.7,
      distance: 4,
      offset: [0, 0.74, 0],
    },
  }),
  getEffect: createDungeonFlameEffectGetter({
    defaultLit: true,
    emitters: [{ offset: [0, 0.4, 0], scale: 0.2, intensity: 10 }],
  }),
})
