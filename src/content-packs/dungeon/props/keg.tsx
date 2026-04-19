import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonKegAsset = createDungeonAsset({
  id: 'dungeon.props_keg',
  slug: 'dungeon-props-keg',
  name: 'Dungeon Keg',
  category: 'prop',
  modelName: 'keg',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
