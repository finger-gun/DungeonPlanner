import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileSmallWeedsBAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_small_weeds_B',
  slug: 'dungeon-floor-floor-tile-small-weeds-B',
  name: 'Dungeon Floor Tile Small Weeds B',
  category: 'floor',
  modelName: 'floor_tile_small_weeds_B',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
