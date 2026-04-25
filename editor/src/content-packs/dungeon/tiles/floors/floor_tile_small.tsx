import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileSmallAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_small',
  slug: 'dungeon-floor-floor-tile-small',
  name: 'Dungeon Floor Tile Small',
  category: 'floor',
  modelName: 'floor_tile_small',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
