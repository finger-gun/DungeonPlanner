import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonCratesStackedAsset = createDungeonAsset({
  id: 'dungeon.props_crates_stacked',
  slug: 'dungeon-props-crates-stacked',
  name: 'Dungeon Crates Stacked',
  category: 'prop',
  modelName: 'crates_stacked',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    blocksLineOfSight: false,
  },
})
