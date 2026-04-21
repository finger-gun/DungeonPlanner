import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarrierHalfAsset = createDungeonAsset({
  id: 'dungeon.wall_barrier_half',
  slug: 'dungeon-wall-barrier-half',
  name: 'Dungeon Barrier Half',
  category: 'wall',
  modelName: 'barrier_half',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
