import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'

export const dungeonCandleLitAsset = createGenericColorSwatch({
  id: 'dungeon.props_candle_lit',
  slug: 'dungeon-props-candle-lit',
  name: 'Dungeon Candle Lit',
  modelName: 'candle_lit',
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
      intensity: 0.85,
      distance: 4.5,
      offset: [0, 0.58, 0],
    },
  }),
  getEffect: createDungeonFlameEffectGetter({
    defaultLit: true,
    emitters: [{ offset: [0, 0.56, 0], scale: 0.46, intensity: 0.72 }],
  }),
})
