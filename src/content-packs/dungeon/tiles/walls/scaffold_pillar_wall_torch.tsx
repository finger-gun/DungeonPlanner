import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldPillarWallTorchAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_pillar_wall_torch',
  slug: 'dungeon-wall-scaffold-pillar-wall-torch',
  name: 'Dungeon Scaffold Pillar Wall Torch',
  category: 'prop',
  modelName: 'scaffold_pillar_wall_torch',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'pillars',
  },
})
