import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldBeamWallAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_beam_wall',
  slug: 'dungeon-wall-scaffold-beam-wall',
  name: 'Dungeon Scaffold Beam Wall',
  category: 'wall',
  modelName: 'scaffold_beam_wall',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
