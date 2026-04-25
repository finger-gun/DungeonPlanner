import * as THREE from 'three'
import type { ContentPackEffect, ContentPackEffectEmitter } from '../../../content-packs/types'

export type ParticleLayerDefinition = {
  count: number
  size: [number, number]
  height: number
  spread: number
  drift: number
  speed: [number, number]
  opacity: number
  colorStart: THREE.ColorRepresentation
  colorEnd: THREE.ColorRepresentation
}

export type ParticleEmitterDefinition = {
  key: string
  offset: [number, number, number]
  scale: number
  intensity: number
  color?: string
  layers: ParticleLayerDefinition[]
}

export type ParticleSeed = {
  basePhase: number
  speed: number
  wobblePhase: number
  radialAngle: number
  radialOffset: number
  size: number
  height: number
  sway: number
}

export const FIRE_LAYERS: ParticleLayerDefinition[] = [
  {
    count: 8,
    size: [0.14, 0.34],
    height: 0.62,
    spread: 0.09,
    drift: 0.06,
    speed: [0.85, 1.35],
    opacity: 0.48,
    colorStart: '#fff1b8',
    colorEnd: '#ff7a1a',
  },
  {
    count: 5,
    size: [0.1, 0.22],
    height: 0.44,
    spread: 0.05,
    drift: 0.04,
    speed: [1.2, 1.85],
    opacity: 0.36,
    colorStart: '#ffd38a',
    colorEnd: '#ff4d00',
  },
  {
    count: 3,
    size: [0.05, 0.12],
    height: 0.78,
    spread: 0.03,
    drift: 0.02,
    speed: [1.5, 2.4],
    opacity: 0.24,
    colorStart: '#ffb347',
    colorEnd: '#ff3b00',
  },
]

export function buildParticleEmitters(effect: ContentPackEffect, effectKey: string) {
  if (effect.preset !== 'fire') {
    return []
  }

  const emitters = effect.emitters?.length
    ? effect.emitters
    : ([{}] satisfies ContentPackEffectEmitter[])

  return emitters.map((emitter, index) => ({
    key: `${effectKey}:${effect.preset}:${index}`,
    offset: emitter.offset ?? [0, 0, 0],
    scale: emitter.scale ?? 1,
    intensity: emitter.intensity ?? 1,
    color: emitter.color,
    layers: FIRE_LAYERS,
  })) satisfies ParticleEmitterDefinition[]
}
