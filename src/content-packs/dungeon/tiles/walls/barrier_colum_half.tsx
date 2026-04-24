import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarrierColumHalfAsset = createDungeonAsset({
  id: 'dungeon.wall_barrier_colum_half',
  slug: 'dungeon-wall-barrier-colum-half',
  name: 'Dungeon Barrier Colum Half',
  category: 'prop',
  modelName: 'barrier_colum_half',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'walls',
  },
})
