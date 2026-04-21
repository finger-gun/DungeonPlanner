import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldPillarsConnectedAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_pillars_connected',
  slug: 'dungeon-wall-scaffold-pillars-connected',
  name: 'Dungeon Scaffold Pillars Connected',
  category: 'wall',
  modelName: 'scaffold_pillars_connected',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
