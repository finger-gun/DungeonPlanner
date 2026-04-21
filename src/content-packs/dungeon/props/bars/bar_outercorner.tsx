import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarOutercornerAsset = createDungeonAsset({
  id: 'dungeon.props_bars_bar_outercorner',
  slug: 'dungeon-props-bars-bar-outercorner',
  name: 'Dungeon Bar Outercorner',
  category: 'prop',
  modelName: 'bar_outercorner',
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
