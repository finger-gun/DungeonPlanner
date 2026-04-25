import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorFoundationFrontAndBackAsset = createDungeonAsset({
  id: 'dungeon.wall_floor_foundation_front_and_back',
  slug: 'dungeon-wall-floor-foundation-front-and-back',
  name: 'Dungeon Floor Foundation Front And Back',
  category: 'prop',
  modelName: 'floor_foundation_front_and_back',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'walls',
  },
})
