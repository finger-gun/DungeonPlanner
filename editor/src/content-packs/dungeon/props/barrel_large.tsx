import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBarrelLargeAsset = createDungeonAsset({
  id: 'dungeon.props_barrel_large',
  slug: 'dungeon-props-barrel-large',
  name: 'Dungeon Barrel Large',
  category: 'prop',
  modelName: 'barrel_large',
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
