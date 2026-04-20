import type { ContentPackModelTransform } from '../../types'
import { createDungeonAsset } from '../shared/createDungeonAsset'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'

const transform: ContentPackModelTransform = {
  position: [0, 1, .125],
  rotation: [0, 0, 0],
  scale: 1,
}

export const dungeonTorchAsset = createDungeonAsset({
  id: 'dungeon.props_torch',
  slug: 'dungeon-props-torch',
  name: 'Dungeon Torch',
  category: 'prop',
  modelName: 'torch',
  transform,
  metadata: {
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    blocksLineOfSight: false,
  },
  getLight: createDungeonFlameLightGetter(),
  getEffect: createDungeonFlameEffectGetter({
    emitters: [{ offset: [0, 1.48, 0], scale: 1.1, intensity: 1.1 }],
  }),
})
