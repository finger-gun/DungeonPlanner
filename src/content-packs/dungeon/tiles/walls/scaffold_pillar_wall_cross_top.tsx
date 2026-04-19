import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldPillarWallCrossTopAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_pillar_wall_cross_top',
  slug: 'dungeon-wall-scaffold-pillar-wall-cross-top',
  name: 'Dungeon Scaffold Pillar Wall Cross Top',
  category: 'wall',
  modelName: 'scaffold_pillar_wall_cross_top',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
