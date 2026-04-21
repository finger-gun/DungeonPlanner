import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonWallCornerGatedAsset = createDungeonAsset({
  id: 'dungeon.wall_wall_corner_gated',
  slug: 'dungeon-wall-wall-corner-gated',
  name: 'Dungeon Wall Corner Gated',
  category: 'wall',
  modelName: 'wall_corner_gated',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
