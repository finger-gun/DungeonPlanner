import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'

export const dungeonCandleThinLitAsset = createDungeonAsset({
  id: 'dungeon.props_candle_thin_lit',
  slug: 'dungeon-props-candle-thin-lit',
  name: 'Dungeon Candle Thin Lit',
  category: 'prop',
  modelName: 'candle_thin_lit',
  transform: DUNGEON_PROP_TRANSFORM,
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
