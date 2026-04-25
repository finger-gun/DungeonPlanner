import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'

export const dungeonCandleTripleAsset = createDungeonAsset({
  id: 'dungeon.props_candle_triple',
  slug: 'dungeon-props-candle-triple',
  name: 'Dungeon Candle Triple',
  category: 'prop',
  modelName: 'candle_triple',
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
    light: {
      intensity: 0.95,
      distance: 5,
      offset: [0, 0.62, 0],
    },
  }),
  getEffect: createDungeonFlameEffectGetter({
    emitters: [
      { offset: [-0.14, 0.52, -0.05], scale: 0.32, intensity: 0.5 },
      { offset: [0.12, 0.6, 0.04], scale: 0.42, intensity: 0.68 },
      { offset: [0, 0.48, 0.12], scale: 0.28, intensity: 0.44 },
    ],
  }),
})
