import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarrierColumnAsset = createDungeonAsset({
  id: 'dungeon.wall_barrier_column',
  slug: 'dungeon-wall-barrier-column',
  name: 'Dungeon Barrier Column',
  category: 'wall',
  modelName: 'barrier_column',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
