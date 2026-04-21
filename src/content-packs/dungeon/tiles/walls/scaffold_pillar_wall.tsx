import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldPillarWallAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_pillar_wall',
  slug: 'dungeon-wall-scaffold-pillar-wall',
  name: 'Dungeon Scaffold Pillar Wall',
  category: 'wall',
  modelName: 'scaffold_pillar_wall',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
