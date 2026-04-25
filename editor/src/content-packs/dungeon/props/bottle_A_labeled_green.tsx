import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBottleALabeledGreenAsset = createDungeonAsset({
  id: 'dungeon.props_bottle_A_labeled_green',
  slug: 'dungeon-props-bottle-A-labeled-green',
  name: 'Dungeon Bottle A Labeled Green',
  category: 'prop',
  modelName: 'bottle_A_labeled_green',
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
