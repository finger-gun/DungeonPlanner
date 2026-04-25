import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileSmallDecoratedAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_small_decorated',
  slug: 'dungeon-floor-floor-tile-small-decorated',
  name: 'Dungeon Floor Tile Small Decorated',
  category: 'floor',
  modelName: 'floor_tile_small_decorated',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
