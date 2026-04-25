import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_FLOOR_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorWoodSmallAsset = createDungeonAsset({
  id: 'dungeon.floor_floor_wood_small',
  slug: 'dungeon-floor-floor-wood-small',
  name: 'Dungeon Floor Wood Small',
  category: 'floor',
  modelName: 'floor_wood_small',
  transform: DUNGEON_FLOOR_TRANSFORM,
  metadata: {
    tileSpan: { gridWidth: 1, gridHeight: 1 },
  },
})
