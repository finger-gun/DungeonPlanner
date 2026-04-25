import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarrierCornerAsset = createDungeonAsset({
  id: 'dungeon.wall_barrier_corner',
  slug: 'dungeon-wall-barrier-corner',
  name: 'Dungeon Barrier Corner',
  category: 'prop',
  modelName: 'barrier_corner',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'walls',
  },
})
