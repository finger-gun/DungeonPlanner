import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBookcaseDoubleAsset = createDungeonAsset({
  id: 'dungeon.props_bookcase_double',
  slug: 'dungeon-props-bookcase-double',
  name: 'Dungeon Bookcase Double',
  category: 'prop',
  modelName: 'bookcase_double',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [
      {
        point: [0, 0, 0.125],  // Back of bookcase against wall
        type: 'WALL',
        rotation: [0, 0, 0],  // Faces outward from wall
      },
      {
        point: [0, 0, 0],  // Bottom center for floor placement
        type: 'FLOOR',
      },
    ],
    propSurface: true,  // Books can be placed on shelves
    blocksLineOfSight: false,
  },
})

