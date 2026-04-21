import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarrierAsset = createDungeonAsset({
  id: 'dungeon.wall_barrier',
  slug: 'dungeon-wall-barrier',
  name: 'Dungeon Barrier',
  category: 'wall',
  modelName: 'barrier',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
