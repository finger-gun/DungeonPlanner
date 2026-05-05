import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'

export const dungeonCandleThinAsset = createGenericColorSwatch({
  id: 'dungeon.props_candle_thin',
  slug: 'dungeon-props-candle-thin',
  name: 'Dungeon Candle Thin',
  modelName: 'candle_thin',
  sourceCells: [[0, 3]],
  variants: DUNGEON_COLOR_SWATCHES,
  defaultVariantId: 'ivory',
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
    defaultLit: true,
    light: {
      intensity: 0.5,
      distance: 2.5,
      offset: [0, 0.58, 0],
    },
  }),
  getEffect: createDungeonFlameEffectGetter({
    defaultLit: true,
    emitters: [{ offset: [0, 0.42, 0], scale: 0.15, intensity: 0.5 }],
  }),
  getPlayModeNextProps: (objectProps) => {
    const lit = objectProps.lit !== false
    return { lit: !lit }
  },
})
