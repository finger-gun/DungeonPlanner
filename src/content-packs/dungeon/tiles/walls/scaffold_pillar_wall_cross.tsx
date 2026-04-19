import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldPillarWallCrossAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_pillar_wall_cross',
  slug: 'dungeon-wall-scaffold-pillar-wall-cross',
  name: 'Dungeon Scaffold Pillar Wall Cross',
  category: 'wall',
  modelName: 'scaffold_pillar_wall_cross',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
