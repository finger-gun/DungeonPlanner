import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileExtralargeGratesOpenAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_extralarge_grates_open',
  slug: 'dungeon-floor-floor-tile-extralarge-grates-open',
  name: 'Dungeon Floor Tile Extralarge Grates Open',
  category: 'floor',
  modelName: 'floor_tile_extralarge_grates_open',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 4, gridHeight: 4 },
  },
})
