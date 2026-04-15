import { describe, expect, it } from 'vitest'
import { getEffectiveFloorViewMode } from './floorViewMode'

describe('getEffectiveFloorViewMode', () => {
  it('keeps scene overview for editor tools', () => {
    expect(getEffectiveFloorViewMode('scene', 'select')).toBe('scene')
  })

  it('forces active-floor rendering in play mode', () => {
    expect(getEffectiveFloorViewMode('scene', 'play')).toBe('active')
  })
})
