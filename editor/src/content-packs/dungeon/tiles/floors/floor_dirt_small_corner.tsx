import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorDirtSmallCornerAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_dirt_small_corner',
  slug: 'dungeon-floor-floor-dirt-small-corner',
  name: 'Dungeon Floor Dirt Small Corner',
  category: 'floor',
  modelName: 'floor_dirt_small_corner',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
