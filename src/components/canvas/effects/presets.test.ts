import { describe, expect, it } from 'vitest'
import { buildParticleEmitters } from './presets'

describe('particle presets', () => {
  it('builds default fire emitters when none are provided', () => {
    const emitters = buildParticleEmitters({ preset: 'fire' }, 'torch')

    expect(emitters).toHaveLength(1)
    expect(emitters[0]).toMatchObject({
      offset: [0, 0, 0],
      scale: 1,
      intensity: 1,
    })
    expect(emitters[0].layers).toHaveLength(3)
  })

  it('preserves custom emitter placement for reusable fire setups', () => {
    const emitters = buildParticleEmitters({
      preset: 'fire',
      emitters: [
        { offset: [0, 1.2, 0], scale: 1.1, intensity: 1.3 },
        { offset: [0.25, 0.4, -0.1], scale: 0.6, intensity: 0.7 },
      ],
    }, 'candles')

    expect(emitters).toMatchObject([
      { offset: [0, 1.2, 0], scale: 1.1, intensity: 1.3 },
      { offset: [0.25, 0.4, -0.1], scale: 0.6, intensity: 0.7 },
    ])
  })
})
