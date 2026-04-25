import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldPillarsConnectedTorchAsset = createDungeonAsset({
  id: 'dungeon.wall_scaffold_pillars_connected_torch',
  slug: 'dungeon-wall-scaffold-pillars-connected-torch',
  name: 'Dungeon Scaffold Pillars Connected Torch',
  category: 'prop',
  modelName: 'scaffold_pillars_connected_torch',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'pillars',
  },
})
