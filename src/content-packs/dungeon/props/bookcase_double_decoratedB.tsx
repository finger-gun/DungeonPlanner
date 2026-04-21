import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBookcaseDoubleDecoratedbAsset = createDungeonAsset({
  id: 'dungeon.props_bookcase_double_decoratedB',
  slug: 'dungeon-props-bookcase-double-decoratedB',
  name: 'Dungeon Bookcase Double Decoratedb',
  category: 'prop',
  modelName: 'bookcase_double_decoratedB',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [
      {
        point: [0, 0, 0.125],
        type: 'WALL',
        rotation: [0, 0, 0],
      },
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    propSurface: true,
    blocksLineOfSight: false,
  },
})
