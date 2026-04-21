import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorFoundationDiagonalCornerAsset = createDungeonAsset({
  id: 'dungeon.wall_floor_foundation_diagonal_corner',
  slug: 'dungeon-wall-floor-foundation-diagonal-corner',
  name: 'Dungeon Floor Foundation Diagonal Corner',
  category: 'wall',
  modelName: 'floor_foundation_diagonal_corner',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
