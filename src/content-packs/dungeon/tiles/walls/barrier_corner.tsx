import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarrierCornerAsset = createDungeonAsset({
  id: 'dungeon.wall_barrier_corner',
  slug: 'dungeon-wall-barrier-corner',
  name: 'Dungeon Barrier Corner',
  category: 'wall',
  modelName: 'barrier_corner',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
