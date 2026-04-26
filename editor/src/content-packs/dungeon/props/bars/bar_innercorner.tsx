import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBarInnercornerAsset = createDungeonAsset({
  id: 'dungeon.props_bars_bar_innercorner',
  slug: 'dungeon-props-bars-bar-innercorner',
  name: 'Dungeon Bar Innercorner',
  category: 'prop',
  modelName: 'bar_innercorner',
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
