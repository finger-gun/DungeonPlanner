import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBarrelSmallAsset = createDungeonAsset({
  id: 'dungeon.props_barrel_small',
  slug: 'dungeon-props-barrel-small',
  name: 'Dungeon Barrel Small',
  category: 'prop',
  modelName: 'barrel_small',
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
