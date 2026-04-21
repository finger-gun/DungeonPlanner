import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'

export const dungeonCandleThinAsset = createDungeonAsset({
  id: 'dungeon.props_candle_thin',
  slug: 'dungeon-props-candle-thin',
  name: 'Dungeon Candle Thin',
  category: 'prop',
  modelName: 'candle_thin',
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
      intensity: 0.7,
      distance: 4,
      offset: [0, 0.74, 0],
    },
  }),
  getEffect: createDungeonFlameEffectGetter({
    emitters: [{ offset: [0, 0.72, 0], scale: 0.34, intensity: 0.58 }],
  }),
})
