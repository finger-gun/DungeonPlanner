import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonKegAsset = createDungeonAsset({
  id: 'dungeon.props_keg',
  slug: 'dungeon-props-keg',
  name: 'Dungeon Keg',
  category: 'prop',
  modelName: 'keg',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'FREE',
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    blocksLineOfSight: false,
  },
})
