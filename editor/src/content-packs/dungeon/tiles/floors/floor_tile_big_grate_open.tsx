import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileBigGrateOpenAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_big_grate_open',
  slug: 'dungeon-floor-floor-tile-big-grate-open',
  name: 'Dungeon Floor Tile Big Grate Open',
  category: 'floor',
  modelName: 'floor_tile_big_grate_open',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 2, gridHeight: 2 },
  },
})
