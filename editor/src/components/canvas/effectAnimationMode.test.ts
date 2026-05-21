import { describe, expect, it } from 'vitest'
import { shouldRunContinuousSceneEffects } from './effectAnimationMode'

describe('effectAnimationMode', () => {
  it('only allows continuous scene effects during play', () => {
    expect(shouldRunContinuousSceneEffects('play')).toBe(true)
    expect(shouldRunContinuousSceneEffects('room')).toBe(false)
    expect(shouldRunContinuousSceneEffects('select')).toBe(false)
  })
})
