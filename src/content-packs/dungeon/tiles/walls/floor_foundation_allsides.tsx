import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonFloorFoundationAllsidesAsset = createDungeonAsset({
  id: 'dungeon.wall_floor_foundation_allsides',
  slug: 'dungeon-wall-floor-foundation-allsides',
  name: 'Dungeon Floor Foundation Allsides',
  category: 'wall',
  modelName: 'floor_foundation_allsides',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
