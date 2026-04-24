import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldFrameSmallAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_frame_small',
  slug: 'dungeon-wall-scaffold-frame-small',
  name: 'Dungeon Scaffold Frame Small',
  category: 'prop',
  modelName: 'scaffold_frame_small',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'pillars',
  },
})
