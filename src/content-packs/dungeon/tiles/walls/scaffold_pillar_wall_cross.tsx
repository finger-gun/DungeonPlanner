import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldPillarWallCrossAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_pillar_wall_cross',
  slug: 'dungeon-wall-scaffold-pillar-wall-cross',
  name: 'Dungeon Scaffold Pillar Wall Cross',
  category: 'prop',
  modelName: 'scaffold_pillar_wall_cross',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'pillars',
  },
})
