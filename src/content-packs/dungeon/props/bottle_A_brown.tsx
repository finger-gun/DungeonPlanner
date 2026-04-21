import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBottleABrownAsset = createDungeonAsset({
  id: 'dungeon.props_bottle_A_brown',
  slug: 'dungeon-props-bottle-A-brown',
  name: 'Dungeon Bottle A Brown',
  category: 'prop',
  modelName: 'bottle_A_brown',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'FREE',
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
      {
        point: [0, 0, 0],
        type: 'SURFACE',
      },
    ],
    blocksLineOfSight: false,
  },
})
