import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonPillarDecoratedAsset = createDungeonAsset({
  id: 'dungeon.wall_pillar_decorated',
  slug: 'dungeon-wall-pillar-decorated',
  name: 'Dungeon Pillar Decorated',
  category: 'wall',
  modelName: 'pillar_decorated',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
