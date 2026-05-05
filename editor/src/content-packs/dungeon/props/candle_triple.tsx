import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'

export const dungeonCandleTripleAsset = createGenericColorSwatch({
  id: 'dungeon.props_candle_triple',
  slug: 'dungeon-props-candle-triple',
  name: 'Dungeon Candle Triple',
  modelName: 'candle_triple',
  sourceCells: [[0, 3]],
  variants: DUNGEON_COLOR_SWATCHES,
  defaultVariantId: 'ivory',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'FREE',
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
  getLight: createDungeonFlameLightGetter({
    light: {
      intensity: 0.5,
      distance: 3.5,
      offset: [0, 0.58, 0],
    },
  }),
  getEffect: createDungeonFlameEffectGetter({
    emitters: [
      { offset: [0, 0.34, 0], scale: 0.15, intensity: 0.5 },
      { offset: [0.11, 0.4, -0.02], scale: 0.15, intensity: 0.5 },
      { offset: [0.1, 0.3, 0.07], scale: 0.15, intensity: 0.5 },
      
    ],
  }),
  getPlayModeNextProps: (objectProps) => {
    const lit = objectProps.lit !== false
    return { lit: !lit }
  },
})
