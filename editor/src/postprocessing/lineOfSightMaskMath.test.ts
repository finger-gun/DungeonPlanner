import { describe, expect, it } from 'vitest'
import { resolveLineOfSightAlpha } from './lineOfSightMaskMath'

describe('resolveLineOfSightAlpha', () => {
  it('keeps visible or explored pixels opaque even if the source pass alpha is zero', () => {
    expect(resolveLineOfSightAlpha(0, 1, 0)).toBe(1)
    expect(resolveLineOfSightAlpha(0, 0, 1)).toBe(1)
    expect(resolveLineOfSightAlpha(0, 0.4, 0.7)).toBe(0.7)
  })

  it('stays transparent when the mask says nothing should be shown', () => {
    expect(resolveLineOfSightAlpha(1, 0, 0)).toBe(0)
  })
})
