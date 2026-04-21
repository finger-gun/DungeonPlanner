import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldBeamsConnectedAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_beams_connected',
  slug: 'dungeon-wall-scaffold-beams-connected',
  name: 'Dungeon Scaffold Beams Connected',
  category: 'wall',
  modelName: 'scaffold_beams_connected',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
