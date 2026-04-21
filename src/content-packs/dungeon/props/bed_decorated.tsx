import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBedDecoratedAsset = createDungeonAsset({
  id: 'dungeon.props_bed_decorated',
  slug: 'dungeon-props-bed-decorated',
  name: 'Dungeon Bed Decorated',
  category: 'prop',
  modelName: 'bed_decorated',
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
