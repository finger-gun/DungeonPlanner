import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'

export const dungeonShelfSmallCandlesAsset = createDungeonAsset({
  id: 'dungeon.props_shelf_small_candles',
  slug: 'dungeon-props-shelf-small-candles',
  name: 'Dungeon Shelf Small Candles',
  category: 'prop',
  modelName: 'shelf_small_candles',
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
      intensity: 1.1,
      distance: 5.5,
      offset: [0, 1.1, 0],
    },
  }),
  getEffect: createDungeonFlameEffectGetter({
    emitters: [
      { offset: [-0.18, 1.02, -0.04], scale: 0.28, intensity: 0.42 },
      { offset: [0.02, 1.08, 0.05], scale: 0.34, intensity: 0.56 },
      { offset: [0.2, 0.98, -0.02], scale: 0.26, intensity: 0.38 },
    ],
  }),
})
