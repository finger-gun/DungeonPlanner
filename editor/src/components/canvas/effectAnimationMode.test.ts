import { describe, expect, it } from 'vitest'
import { shouldRunContinuousFireParticles, shouldRunContinuousSceneEffects } from './effectAnimationMode'

describe('effectAnimationMode', () => {
  it('only allows continuous effect animation during play when build animations are idle', () => {
    expect(shouldRunContinuousSceneEffects('play', false)).toBe(true)
    expect(shouldRunContinuousSceneEffects('room', false)).toBe(false)
    expect(shouldRunContinuousSceneEffects('select', false)).toBe(false)
    expect(shouldRunContinuousSceneEffects('play', true)).toBe(false)
  })

  it('keeps fire particles animating whenever build animations are idle', () => {
    expect(shouldRunContinuousFireParticles(false)).toBe(true)
    expect(shouldRunContinuousFireParticles(true)).toBe(false)
  })
})
