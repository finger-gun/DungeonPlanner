import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarrierHalfAsset = createDungeonAsset({
  id: 'dungeon.wall_barrier_half',
  slug: 'dungeon-wall-barrier-half',
  name: 'Dungeon Barrier Half',
  category: 'prop',
  modelName: 'barrier_half',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'walls',
  },
})
