import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarStraightBShortAsset = createDungeonAsset({
  id: 'dungeon.props_bars_bar_straight_B_short',
  slug: 'dungeon-props-bars-bar-straight-B-short',
  name: 'Dungeon Bar Straight B Short',
  category: 'prop',
  modelName: 'bar_straight_B_short',
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
