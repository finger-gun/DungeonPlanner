import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorWoodLargeDarkAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_wood_large_dark',
  slug: 'dungeon-floor-floor-wood-large-dark',
  name: 'Dungeon Floor Wood Large Dark',
  category: 'floor',
  modelName: 'floor_wood_large_dark',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 2, gridHeight: 2 },
  },
})
