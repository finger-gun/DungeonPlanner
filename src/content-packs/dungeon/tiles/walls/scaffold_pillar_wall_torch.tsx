import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldPillarWallTorchAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_pillar_wall_torch',
  slug: 'dungeon-wall-scaffold-pillar-wall-torch',
  name: 'Dungeon Scaffold Pillar Wall Torch',
  category: 'wall',
  modelName: 'scaffold_pillar_wall_torch',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
