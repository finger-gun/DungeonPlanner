import { createDungeonAsset } from '../shared/createDungeonAsset'
import { type ContentPackModelTransform } from '../../types'

const transform: ContentPackModelTransform = {
  position: [0, 0, -0.5],
  rotation: [0, 0, 0],
} 

export const dungeonShelvesAsset = createDungeonAsset({
  id: 'dungeon.props_shelves',
  slug: 'dungeon-props-shelves',
  name: 'Dungeon Shelves',
  category: 'prop',
  modelName: 'shelves',
  transform: transform,
  metadata: {
    snapsTo: 'GRID',
    blocksLineOfSight: false,
    propSurface: true,
    connectors: [
      {
        point: [0, 0, 0],
        type: 'WALL',
        rotation: [0, 0, 0],  // Faces outward from wall
      },
    ]
  },
})
