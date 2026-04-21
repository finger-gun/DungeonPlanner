import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorDirtSmallAAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_dirt_small_A',
  slug: 'dungeon-floor-floor-dirt-small-A',
  name: 'Dungeon Floor Dirt Small A',
  category: 'floor',
  modelName: 'floor_dirt_small_A',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
