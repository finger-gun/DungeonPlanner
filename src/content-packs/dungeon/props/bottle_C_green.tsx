import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBottleCGreenAsset = createDungeonAsset({
  id: 'dungeon.props_bottle_C_green',
  slug: 'dungeon-props-bottle-C-green',
  name: 'Dungeon Bottle C Green',
  category: 'prop',
  modelName: 'bottle_C_green',
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
