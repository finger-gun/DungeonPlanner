import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileLargeAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_large',
  slug: 'dungeon-floor-floor-tile-large',
  name: 'Dungeon Floor Tile Large',
  category: 'floor',
  modelName: 'floor_tile_large',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 2, gridHeight: 2 },
  },
})
