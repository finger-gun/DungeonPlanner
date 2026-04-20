import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBoxSmallAsset = createDungeonAsset({
  id: 'dungeon.props_box_small',
  slug: 'dungeon-props-box-small',
  name: 'Dungeon Box Small',
  category: 'prop',
  modelName: 'box_small',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'FREE',
    propSurface: true,
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
