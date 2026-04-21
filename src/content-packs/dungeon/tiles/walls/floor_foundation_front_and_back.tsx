import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorFoundationFrontAndBackAsset = createDungeonAsset({
  id: 'dungeon.wall_floor_foundation_front_and_back',
  slug: 'dungeon-wall-floor-foundation-front-and-back',
  name: 'Dungeon Floor Foundation Front And Back',
  category: 'wall',
  modelName: 'floor_foundation_front_and_back',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
