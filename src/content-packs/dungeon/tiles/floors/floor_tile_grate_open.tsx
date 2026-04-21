import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileGrateOpenAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_grate_open',
  slug: 'dungeon-floor-floor-tile-grate-open',
  name: 'Dungeon Floor Tile Grate Open',
  category: 'floor',
  modelName: 'floor_tile_grate_open',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 2, gridHeight: 1 },
  },
})
