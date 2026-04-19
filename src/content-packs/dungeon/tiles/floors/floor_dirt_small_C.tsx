import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorDirtSmallCAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_dirt_small_C',
  slug: 'dungeon-floor-floor-dirt-small-C',
  name: 'Dungeon Floor Dirt Small C',
  category: 'floor',
  modelName: 'floor_dirt_small_C',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
