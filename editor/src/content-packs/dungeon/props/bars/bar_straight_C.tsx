import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarStraightCAsset = createDungeonAsset({
  id: 'dungeon.props_bars_bar_straight_C',
  slug: 'dungeon-props-bars-bar-straight-C',
  name: 'Dungeon Bar Straight C',
  category: 'prop',
  modelName: 'bar_straight_C',
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
})
