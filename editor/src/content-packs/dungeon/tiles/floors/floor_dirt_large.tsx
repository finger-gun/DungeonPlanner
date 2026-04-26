import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorDirtLargeAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_dirt_large',
  slug: 'dungeon-floor-floor-dirt-large',
  name: 'Dungeon Floor Dirt Large',
  category: 'floor',
  modelName: 'floor_dirt_large',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 2, gridHeight: 2 },
  },
})
