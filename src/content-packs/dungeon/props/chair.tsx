import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonChairAsset = createDungeonAsset({
  id: 'dungeon.props_chair',
  slug: 'dungeon-props-chair',
  name: 'Dungeon Chair',
  category: 'prop',
  modelName: 'chair',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
