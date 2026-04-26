import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldBeamsConnectedAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_beams_connected',
  slug: 'dungeon-wall-scaffold-beams-connected',
  name: 'Dungeon Scaffold Beams Connected',
  category: 'prop',
  modelName: 'scaffold_beams_connected',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'pillars',
  },
})
