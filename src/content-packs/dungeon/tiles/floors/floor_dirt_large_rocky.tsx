import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorDirtLargeRockyAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_dirt_large_rocky',
  slug: 'dungeon-floor-floor-dirt-large-rocky',
  name: 'Dungeon Floor Dirt Large Rocky',
  category: 'floor',
  modelName: 'floor_dirt_large_rocky',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 2, gridHeight: 2 },
  },
})
