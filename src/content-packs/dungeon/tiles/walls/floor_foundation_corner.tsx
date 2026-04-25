import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorFoundationCornerAsset = createDungeonAsset({
  id: 'dungeon.wall_floor_foundation_corner',
  slug: 'dungeon-wall-floor-foundation-corner',
  name: 'Dungeon Floor Foundation Corner',
  category: 'prop',
  modelName: 'floor_foundation_corner',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'walls',
  },
})
