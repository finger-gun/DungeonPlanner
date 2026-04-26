import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonColumnAsset = createDungeonAsset({
  id: 'dungeon.props_pillars_column',
  slug: 'dungeon-props-pillars-column',
  name: 'Dungeon Column',
  category: 'prop',
  modelName: 'column',
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
