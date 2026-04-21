import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorFoundationFrontAndSidesAsset = createDungeonAsset({
  id: 'dungeon.wall_floor_foundation_front_and_sides',
  slug: 'dungeon-wall-floor-foundation-front-and-sides',
  name: 'Dungeon Floor Foundation Front And Sides',
  category: 'wall',
  modelName: 'floor_foundation_front_and_sides',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
