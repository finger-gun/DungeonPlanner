import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldBeamWallAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_beam_wall',
  slug: 'dungeon-wall-scaffold-beam-wall',
  name: 'Dungeon Scaffold Beam Wall',
  category: 'prop',
  modelName: 'scaffold_beam_wall',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'pillars',
  },
})
