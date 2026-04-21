import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorFoundationFrontAsset = createDungeonAsset({
  id: 'dungeon.wall_floor_foundation_front',
  slug: 'dungeon-wall-floor-foundation-front',
  name: 'Dungeon Floor Foundation Front',
  category: 'wall',
  modelName: 'floor_foundation_front',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
