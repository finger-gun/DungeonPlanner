import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldPillarWallCrossTopAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_pillar_wall_cross_top',
  slug: 'dungeon-wall-scaffold-pillar-wall-cross-top',
  name: 'Dungeon Scaffold Pillar Wall Cross Top',
  category: 'prop',
  modelName: 'scaffold_pillar_wall_cross_top',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'pillars',
  },
})
