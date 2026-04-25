import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileSmallBrokenAAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_small_broken_A',
  slug: 'dungeon-floor-floor-tile-small-broken-A',
  name: 'Dungeon Floor Tile Small Broken A',
  category: 'floor',
  modelName: 'floor_tile_small_broken_A',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
