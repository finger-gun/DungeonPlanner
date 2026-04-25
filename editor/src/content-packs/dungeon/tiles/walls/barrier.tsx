import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarrierAsset = createDungeonAsset({
  id: 'dungeon.wall_barrier',
  slug: 'dungeon-wall-barrier',
  name: 'Dungeon Barrier',
  category: 'prop',
  modelName: 'barrier',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'walls',
  },
})
