import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorDirtSmallWeedsAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_dirt_small_weeds',
  slug: 'dungeon-floor-floor-dirt-small-weeds',
  name: 'Dungeon Floor Dirt Small Weeds',
  category: 'floor',
  modelName: 'floor_dirt_small_weeds',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
