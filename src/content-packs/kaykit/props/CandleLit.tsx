import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform
const light = {
  color: '#ffcc82',
  intensity: 1.2,
  distance: 5,
  decay: 1.2,
  offset: [0, 0.82, 0] as [number, number, number],
  flicker: true,
} as const

export const kaykitCandleLitAsset = createKayKitAsset({
  id: 'kaykit.props_candle_lit',
  slug: 'kaykit-props-candle-lit',
  name: 'KayKit Lit Candle',
  category: 'prop',
  modelName: 'candle_lit',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FREE',
    blocksLineOfSight: false,
    light,
  },
  getLight: () => light,
})
