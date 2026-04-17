import { createKayKitAsset, type KayKitTransform } from '../shared/createKayKitAsset'

const ASSET_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: [1, 1, 1],
} satisfies KayKitTransform
const baseLight = {
  color: '#ffcc82',
  intensity: 1.2,
  distance: 5,
  decay: 1.2,
  offset: [0, 0.82, 0] as [number, number, number],
  flicker: true,
} as const

const light = {
  ...baseLight,
  intensity: 1.8,
  distance: 5.5,
} as const

export const kaykitCandleTripleAsset = createKayKitAsset({
  id: 'kaykit.props_candle_triple',
  slug: 'kaykit-props-candle-triple',
  name: 'KayKit Triple Candle',
  category: 'prop',
  modelName: 'candle_triple',
  transform: ASSET_TRANSFORM,
  metadata: {
    connectsTo: 'FREE',
    blocksLineOfSight: false,
    light,
  },
  getLight: () => light,
})
