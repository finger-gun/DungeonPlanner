import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldFrameLargeAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_frame_large',
  slug: 'dungeon-wall-scaffold-frame-large',
  name: 'Dungeon Scaffold Frame Large',
  category: 'wall',
  modelName: 'scaffold_frame_large',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
