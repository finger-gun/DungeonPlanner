import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'

export const dungeonCandleAsset = createDungeonAsset({
  id: 'dungeon.props_candle',
  slug: 'dungeon-props-candle',
  name: 'Dungeon Candle',
  category: 'prop',
  modelName: 'candle',
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
      intensity: 0.85,
      distance: 4.5,
      offset: [0, 0.58, 0],
    },
  }),
  getEffect: createDungeonFlameEffectGetter({
    emitters: [{ offset: [0, 0.56, 0], scale: 0.46, intensity: 0.72 }],
  }),
})
