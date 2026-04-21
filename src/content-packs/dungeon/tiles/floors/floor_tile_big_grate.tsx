import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileBigGrateAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_big_grate',
  slug: 'dungeon-floor-floor-tile-big-grate',
  name: 'Dungeon Floor Tile Big Grate',
  category: 'floor',
  modelName: 'floor_tile_big_grate',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 2, gridHeight: 2 },
  },
})
