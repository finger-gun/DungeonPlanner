import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorDirtSmallDAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_dirt_small_D',
  slug: 'dungeon-floor-floor-dirt-small-D',
  name: 'Dungeon Floor Dirt Small D',
  category: 'floor',
  modelName: 'floor_dirt_small_D',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
