import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonWallCornerScaffoldAsset = createDungeonAsset({
  id: 'dungeon.wall_wall_corner_scaffold',
  slug: 'dungeon-wall-wall-corner-scaffold',
  name: 'Dungeon Wall Corner Scaffold',
  category: 'wall',
  modelName: 'wall_corner_scaffold',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
