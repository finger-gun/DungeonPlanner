import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorWoodLargeAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_wood_large',
  slug: 'dungeon-floor-floor-wood-large',
  name: 'Dungeon Floor Wood Large',
  category: 'floor',
  modelName: 'floor_wood_large',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 2, gridHeight: 2 },
  },
})
