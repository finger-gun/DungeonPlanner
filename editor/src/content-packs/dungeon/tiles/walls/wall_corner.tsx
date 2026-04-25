import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonWallCornerAsset = createDungeonAsset({
  id: 'dungeon.wall_wall_corner',
  slug: 'dungeon-wall-wall-corner',
  name: 'Dungeon Wall Corner',
  category: 'wall',
  modelName: 'wall_corner',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
