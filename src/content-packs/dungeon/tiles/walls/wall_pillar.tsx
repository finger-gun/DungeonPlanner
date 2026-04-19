import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonWallPillarAsset = createDungeonAsset({
  id: 'dungeon.wall_wall_pillar',
  slug: 'dungeon-wall-wall-pillar',
  name: 'Dungeon Wall Pillar',
  category: 'wall',
  modelName: 'wall_pillar',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
