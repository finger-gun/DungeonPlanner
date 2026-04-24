import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorFoundationFrontAsset = createDungeonAsset({
  id: 'dungeon.wall_floor_foundation_front',
  slug: 'dungeon-wall-floor-foundation-front',
  name: 'Dungeon Floor Foundation Front',
  category: 'prop',
  modelName: 'floor_foundation_front',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'walls',
  },
})
