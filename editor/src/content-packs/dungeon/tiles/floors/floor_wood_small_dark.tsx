import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorWoodSmallDarkAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_wood_small_dark',
  slug: 'dungeon-floor-floor-wood-small-dark',
  name: 'Dungeon Floor Wood Small Dark',
  category: 'floor',
  modelName: 'floor_wood_small_dark',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
