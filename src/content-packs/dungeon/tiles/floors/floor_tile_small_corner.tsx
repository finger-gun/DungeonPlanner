import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileSmallCornerAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_small_corner',
  slug: 'dungeon-floor-floor-tile-small-corner',
  name: 'Dungeon Floor Tile Small Corner',
  category: 'floor',
  modelName: 'floor_tile_small_corner',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
