import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarStraightBAsset = createDungeonAsset({
  id: 'dungeon.props_bars_bar_straight_B',
  slug: 'dungeon-props-bars-bar-straight-B',
  name: 'Dungeon Bar Straight B',
  category: 'prop',
  modelName: 'bar_straight_B',
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
