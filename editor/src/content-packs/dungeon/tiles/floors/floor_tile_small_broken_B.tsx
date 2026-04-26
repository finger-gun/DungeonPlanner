import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileSmallBrokenBAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_small_broken_B',
  slug: 'dungeon-floor-floor-tile-small-broken-B',
  name: 'Dungeon Floor Tile Small Broken B',
  category: 'floor',
  modelName: 'floor_tile_small_broken_B',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
