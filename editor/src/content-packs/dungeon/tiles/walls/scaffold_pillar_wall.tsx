import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldPillarWallAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_pillar_wall',
  slug: 'dungeon-wall-scaffold-pillar-wall',
  name: 'Dungeon Scaffold Pillar Wall',
  category: 'prop',
  modelName: 'scaffold_pillar_wall',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'pillars',
  },
})
