import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'

export const dungeonCandleMeltedAsset = createDungeonAsset({
  id: 'dungeon.props_candle_melted',
  slug: 'dungeon-props-candle-melted',
  name: 'Dungeon Candle Melted',
  category: 'prop',
  modelName: 'candle_melted',
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
      intensity: 0.75,
      distance: 4,
      offset: [0, 0.42, 0],
    },
  }),
  getEffect: createDungeonFlameEffectGetter({
    emitters: [{ offset: [0, 0.4, 0], scale: 0.35, intensity: 0.6 }],
  }),
})
