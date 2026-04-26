import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileSmallWeedsAAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_small_weeds_A',
  slug: 'dungeon-floor-floor-tile-small-weeds-A',
  name: 'Dungeon Floor Tile Small Weeds A',
  category: 'floor',
  modelName: 'floor_tile_small_weeds_A',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
