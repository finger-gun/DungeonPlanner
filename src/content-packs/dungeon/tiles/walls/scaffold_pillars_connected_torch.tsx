import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldPillarsConnectedTorchAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_pillars_connected_torch',
  slug: 'dungeon-wall-scaffold-pillars-connected-torch',
  name: 'Dungeon Scaffold Pillars Connected Torch',
  category: 'wall',
  modelName: 'scaffold_pillars_connected_torch',
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    wallSpan: 1,
  },
})
