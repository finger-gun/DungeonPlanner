import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBookcaseSingleDecoratedbAsset = createDungeonAsset({
  id: 'dungeon.props_bookcase_single_decoratedB',
  slug: 'dungeon-props-bookcase-single-decoratedB',
  name: 'Dungeon Bookcase Single Decoratedb',
  category: 'prop',
  modelName: 'bookcase_single_decoratedB',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
