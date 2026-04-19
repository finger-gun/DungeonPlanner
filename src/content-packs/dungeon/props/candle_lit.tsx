import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonCandleLitAsset = createDungeonAsset({
  id: 'dungeon.props_candle_lit',
  slug: 'dungeon-props-candle-lit',
  name: 'Dungeon Candle Lit',
  category: 'prop',
  modelName: 'candle_lit',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
  getLight: (objectProps) => {
    const lit = objectProps?.lit === true
    return lit ? {
      color: '#ff9944',
      intensity: 1.5,
      distance: 8,
      decay: 2,
      offset: [0, 1.5, 0],
      flicker: true,
    } : null
  },
})
