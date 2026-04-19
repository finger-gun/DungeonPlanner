import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonShelfSmallCandlesAsset = createDungeonAsset({
  id: 'dungeon.props_shelf_small_candles',
  slug: 'dungeon-props-shelf-small-candles',
  name: 'Dungeon Shelf Small Candles',
  category: 'prop',
  modelName: 'shelf_small_candles',
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
