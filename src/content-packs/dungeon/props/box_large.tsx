import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBoxLargeAsset = createDungeonAsset({
  id: 'dungeon.props_box_large',
  slug: 'dungeon-props-box-large',
  name: 'Dungeon Box Large',
  category: 'prop',
  modelName: 'box_large',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectsTo: 'FLOOR',
    blocksLineOfSight: false,
  },
})
