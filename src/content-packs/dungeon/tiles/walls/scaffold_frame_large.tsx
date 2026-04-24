import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldFrameLargeAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_frame_large',
  slug: 'dungeon-wall-scaffold-frame-large',
  name: 'Dungeon Scaffold Frame Large',
  category: 'prop',
  modelName: 'scaffold_frame_large',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'pillars',
  },
})
