import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonShelvesDecoratedAsset = createDungeonAsset({
  id: 'dungeon.props_shelves_decorated',
  slug: 'dungeon-props-shelves-decorated',
  name: 'Dungeon Shelves Decorated',
  category: 'prop',
  modelName: 'shelves_decorated',
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
