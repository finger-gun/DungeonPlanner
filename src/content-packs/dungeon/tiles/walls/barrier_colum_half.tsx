import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarrierColumHalfAsset = createDungeonAsset({
  id: 'dungeon.wall_barrier_colum_half',
  slug: 'dungeon-wall-barrier-colum-half',
  name: 'Dungeon Barrier Colum Half',
  category: 'wall',
  modelName: 'barrier_colum_half',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
