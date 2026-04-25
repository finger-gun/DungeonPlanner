import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorFoundationFrontAndSidesAsset = createDungeonAsset({
  id: 'dungeon.wall_floor_foundation_front_and_sides',
  slug: 'dungeon-wall-floor-foundation-front-and-sides',
  name: 'Dungeon Floor Foundation Front And Sides',
  category: 'prop',
  modelName: 'floor_foundation_front_and_sides',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'walls',
  },
})
