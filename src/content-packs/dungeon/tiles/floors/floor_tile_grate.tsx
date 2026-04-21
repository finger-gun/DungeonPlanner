import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileGrateAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_grate',
  slug: 'dungeon-floor-floor-tile-grate',
  name: 'Dungeon Floor Tile Grate',
  category: 'floor',
  modelName: 'floor_tile_grate',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 2, gridHeight: 1 },
  },
})
