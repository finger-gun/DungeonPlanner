import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBarrelSmallStackAsset = createDungeonAsset({
  id: 'dungeon.props_barrel_small_stack',
  slug: 'dungeon-props-barrel-small-stack',
  name: 'Dungeon Barrel Small Stack',
  category: 'prop',
  modelName: 'barrel_small_stack',
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
