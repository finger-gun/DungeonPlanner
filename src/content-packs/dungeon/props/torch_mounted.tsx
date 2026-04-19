import type { ContentPackModelTransform } from '../../types'
import { createDungeonAsset } from '../shared/createDungeonAsset'


const transform: ContentPackModelTransform = {
  position: [0, 1, .125],
  rotation: [0, 0, 0],
  scale: 1,
} 

export const dungeonTorchMountedAsset = createDungeonAsset({
  id: 'dungeon.props_torch_mounted',
  slug: 'dungeon-props-torch-mounted',
  name: 'Dungeon Torch Mounted',
  category: 'prop',
  modelName: 'torch_mounted',
  transform,
  metadata: {
    connectsTo: 'WALL',
    snapsTo: 'GRID',
    connectors: [
      {
        type: 'WALL',
        point: [0, 1, -0.125], // Back of torch against wall
      }
    ],
    blocksLineOfSight: false,
  },
  getLight: (objectProps) => {
    const lit = objectProps?.lit === true
    return lit ? {
      color: '#ff9944',
      intensity: 1.5,
      distance: 8,
      decay: 2,
      offset: [0, 1.5, 0],
      flicker: true,
    } : null
  },
})
