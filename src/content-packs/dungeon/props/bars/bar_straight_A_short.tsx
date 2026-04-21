import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarStraightAShortAsset = createDungeonAsset({
  id: 'dungeon.props_bars_bar_straight_A_short',
  slug: 'dungeon-props-bars-bar-straight-A-short',
  name: 'Dungeon Bar Straight A Short',
  category: 'prop',
  modelName: 'bar_straight_A_short',
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
