import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarrierColumnAsset = createDungeonAsset({
  id: 'dungeon.wall_barrier_column',
  slug: 'dungeon-wall-barrier-column',
  name: 'Dungeon Barrier Column',
  category: 'prop',
  modelName: 'barrier_column',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'walls',
  },
})
