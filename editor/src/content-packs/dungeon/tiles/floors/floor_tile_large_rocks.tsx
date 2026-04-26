import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileLargeRocksAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_large_rocks',
  slug: 'dungeon-floor-floor-tile-large-rocks',
  name: 'Dungeon Floor Tile Large Rocks',
  category: 'floor',
  modelName: 'floor_tile_large_rocks',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 2, gridHeight: 2 },
  },
})
