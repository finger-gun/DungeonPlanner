import { createGenericColorSwatch, DUNGEON_COLOR_SWATCHES } from '../shared/dungeonColorAtlas'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'

export const dungeonCandleMeltedAsset = createGenericColorSwatch({
  id: 'dungeon.props_candle_melted',
  slug: 'dungeon-props-candle-melted',
  name: 'Dungeon Candle Melted',
  modelName: 'candle_melted',
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
    defaultLit: false,
    light: {
      intensity: 0.75,
      distance: 4,
      offset: [0, 0.42, 0],
    },
  }),
  getEffect: createDungeonFlameEffectGetter({
    defaultLit: false,
    emitters: [{ offset: [0, 0.3, 0], scale: 0.35, intensity: 0.6 }],
  }),
  getPlayModeNextProps: (objectProps) => {
    const lit = objectProps.lit !== false
    return { lit: !lit }
  },
})
