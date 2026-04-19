import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBookcaseSingleAsset = createDungeonAsset({
  id: 'dungeon.props_bookcase_single',
  slug: 'dungeon-props-bookcase-single',
  name: 'Dungeon Bookcase Single',
  category: 'prop',
  modelName: 'bookcase_single',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
