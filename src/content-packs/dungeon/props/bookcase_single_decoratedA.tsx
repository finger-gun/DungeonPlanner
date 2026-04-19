import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBookcaseSingleDecoratedaAsset = createDungeonAsset({
  id: 'dungeon.props_bookcase_single_decoratedA',
  slug: 'dungeon-props-bookcase-single-decoratedA',
  name: 'Dungeon Bookcase Single Decorateda',
  category: 'prop',
  modelName: 'bookcase_single_decoratedA',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
