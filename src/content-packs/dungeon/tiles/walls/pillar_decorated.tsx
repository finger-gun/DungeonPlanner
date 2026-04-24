import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonPillarDecoratedAsset = createDungeonAsset({
  id: 'dungeon.wall_pillar_decorated',
  slug: 'dungeon-wall-pillar-decorated',
  name: 'Dungeon Pillar Decorated',
  category: 'prop',
  modelName: 'pillar_decorated',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [{ point: [0, 0, 0], type: 'FLOOR' }],
    blocksLineOfSight: false,
    browserCategory: 'structure',
    browserSubcategory: 'pillars',
  },
})
