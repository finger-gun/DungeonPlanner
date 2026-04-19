import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarStraightAAsset = createDungeonAsset({
  id: 'dungeon.props_bars_bar_straight_A',
  slug: 'dungeon-props-bars-bar-straight-A',
  name: 'Dungeon Bar Straight A',
  category: 'prop',
  modelName: 'bar_straight_A',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
