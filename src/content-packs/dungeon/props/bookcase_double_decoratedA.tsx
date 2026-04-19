import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBookcaseDoubleDecoratedaAsset = createDungeonAsset({
  id: 'dungeon.props_bookcase_double_decoratedA',
  slug: 'dungeon-props-bookcase-double-decoratedA',
  name: 'Dungeon Bookcase Double Decorateda',
  category: 'prop',
  modelName: 'bookcase_double_decoratedA',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
