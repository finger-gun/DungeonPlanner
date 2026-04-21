import type { ContentPackModelTransform } from '../../types'
import { createDungeonAsset } from '../shared/createDungeonAsset'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'


const transform: ContentPackModelTransform = {
  position: [0, 0.9, -0.4],
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
    snapsTo: 'GRID',
    connectors: [
      {
        type: 'WALL',
        point: [0, 0, 0],
      }
    ],
    blocksLineOfSight: false,
  },
  getLight: createDungeonFlameLightGetter(),
  getEffect: createDungeonFlameEffectGetter({
    emitters: [{ offset: [0, 1.48, 0], scale: 1.1, intensity: 1.1 }],
  }),
})
