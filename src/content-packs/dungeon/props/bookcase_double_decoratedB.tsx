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
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
