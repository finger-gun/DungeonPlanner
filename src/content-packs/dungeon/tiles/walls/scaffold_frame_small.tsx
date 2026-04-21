import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldFrameSmallAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_frame_small',
  slug: 'dungeon-wall-scaffold-frame-small',
  name: 'Dungeon Scaffold Frame Small',
  category: 'wall',
  modelName: 'scaffold_frame_small',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
