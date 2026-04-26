import { createDungeonAsset } from '../shared/createDungeonAsset'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'
import { type ContentPackModelTransform } from '../../types'

const transform: ContentPackModelTransform = {
  position: [0, 0.1, 0],
  rotation: [0, 0, 0],
}
export const dungeonTorchLitAsset = createDungeonAsset({
  id: 'dungeon.props_torch_lit',
  slug: 'dungeon-props-torch-lit',
  name: 'Dungeon Torch Lit',
  category: 'prop',
  modelName: 'torch_lit',
  transform,
  metadata: {
    snapsTo: 'FREE',
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
  getLight: createDungeonFlameLightGetter({ defaultLit: true }),
  getEffect: createDungeonFlameEffectGetter({
    defaultLit: true,
    emitters: [{ offset: [0, 0.3, 0], scale: 0.4, intensity: 2 }],
  }),
})
