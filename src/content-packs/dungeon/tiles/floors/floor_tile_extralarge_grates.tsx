import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileExtralargeGratesAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_extralarge_grates',
  slug: 'dungeon-floor-floor-tile-extralarge-grates',
  name: 'Dungeon Floor Tile Extralarge Grates',
  category: 'floor',
  modelName: 'floor_tile_extralarge_grates',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 4, gridHeight: 4 },
  },
})
