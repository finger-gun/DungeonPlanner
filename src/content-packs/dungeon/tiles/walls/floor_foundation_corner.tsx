import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorFoundationCornerAsset = createDungeonAsset({
  id: 'dungeon.wall_floor_foundation_corner',
  slug: 'dungeon-wall-floor-foundation-corner',
  name: 'Dungeon Floor Foundation Corner',
  category: 'wall',
  modelName: 'floor_foundation_corner',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
