import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldPillarsConnectedAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_pillars_connected',
  slug: 'dungeon-wall-scaffold-pillars-connected',
  name: 'Dungeon Scaffold Pillars Connected',
  category: 'prop',
  modelName: 'scaffold_pillars_connected',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'pillars',
  },
})
