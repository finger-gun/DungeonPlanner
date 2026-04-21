import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorTileBigSpikesAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_tile_big_spikes',
  slug: 'dungeon-floor-floor-tile-big-spikes',
  name: 'Dungeon Floor Tile Big Spikes',
  category: 'floor',
  modelName: 'floor_tile_big_spikes',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 2, gridHeight: 2 },
  },
})
