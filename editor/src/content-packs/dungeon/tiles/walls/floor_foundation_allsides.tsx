import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorFoundationAllsidesAsset = createDungeonAsset({
  id: 'dungeon.wall_floor_foundation_allsides',
  slug: 'dungeon-wall-floor-foundation-allsides',
  name: 'Dungeon Floor Foundation Allsides',
  category: 'prop',
  modelName: 'floor_foundation_allsides',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'walls',
  },
})
