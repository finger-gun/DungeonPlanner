import type { ContentPackModelTransform } from '../../types'
import { createDungeonAsset } from '../shared/createDungeonAsset'

const transform: ContentPackModelTransform = {
  position: [0, 0, -0.5],
  rotation: [0, 0, 0],
} 

export const dungeonShelvesDecoratedAsset = createDungeonAsset({
  id: 'dungeon.props_shelves_decorated',
  slug: 'dungeon-props-shelves-decorated',
  name: 'Dungeon Shelves Decorated',
  category: 'prop',
  modelName: 'shelves_decorated',
  transform,
  metadata: {
    snapsTo: 'GRID',
    connectors: [
      {
        point: [0, 0, 0],
        type: 'WALL',
      },
    ],
    blocksLineOfSight: false,
  },
})
