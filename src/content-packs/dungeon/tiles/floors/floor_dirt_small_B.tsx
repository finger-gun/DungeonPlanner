import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorDirtSmallBAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_dirt_small_B',
  slug: 'dungeon-floor-floor-dirt-small-B',
  name: 'Dungeon Floor Dirt Small B',
  category: 'floor',
  modelName: 'floor_dirt_small_B',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
