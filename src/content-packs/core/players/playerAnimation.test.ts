import { describe, expect, it } from 'vitest'
import { getDefaultPlayerAnimationName, getPlayerAnimationName } from './playerAnimation'

describe('getDefaultPlayerAnimationName', () => {
  it('prefers Idle_A when available', () => {
    expect(getDefaultPlayerAnimationName(['T-Pose', 'Running_A', 'Idle_A'])).toBe('Idle_A')
  })

  it('avoids choosing T-Pose when another clip exists', () => {
    expect(getDefaultPlayerAnimationName(['T-Pose', 'Running_A'])).toBe('Running_A')
  })

  it('returns null when the animation library is empty', () => {
    expect(getDefaultPlayerAnimationName([])).toBeNull()
  })
})

describe('getPlayerAnimationName', () => {
  it('stays on idle behavior while selected', () => {
    expect(getPlayerAnimationName(['Idle_A', 'T-Pose'], 'selected')).toBe('Idle_A')
  })

  it('falls back to idle behavior when not selected', () => {
    expect(getPlayerAnimationName(['Idle_A', 'T-Pose'], 'default')).toBe('Idle_A')
  })

  it('maps drag phases to jump clips', () => {
    const names = ['Jump_Start', 'Jump_Idle', 'Jump_Land', 'Idle_A']
    expect(getPlayerAnimationName(names, 'pickup')).toBe('Jump_Start')
    expect(getPlayerAnimationName(names, 'holding')).toBe('Jump_Idle')
    expect(getPlayerAnimationName(names, 'release')).toBe('Jump_Land')
  })
})
