import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBottleALabeledBrownAsset = createDungeonAsset({
  id: 'dungeon.props_bottle_A_labeled_brown',
  slug: 'dungeon-props-bottle-A-labeled-brown',
  name: 'Dungeon Bottle A Labeled Brown',
  category: 'prop',
  modelName: 'bottle_A_labeled_brown',
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
