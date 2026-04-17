import { describe, expect, it } from 'vitest'
import { resolveAutofocusTarget } from './autofocusTarget'

describe('resolveAutofocusTarget', () => {
  it('prefers the orbit target over a raycast hit', () => {
    expect(
      resolveAutofocusTarget(
        true,
        { x: 1, y: 2, z: 3 },
        { x: 4, y: 5, z: 6 },
      ),
    ).toEqual({ x: 1, y: 2, z: 3 })
  })

  it('prefers the raycast hit when orbit target should not override it', () => {
    expect(
      resolveAutofocusTarget(
        false,
        { x: 1, y: 2, z: 3 },
        { x: 4, y: 5, z: 6 },
      ),
    ).toEqual({ x: 4, y: 5, z: 6 })
  })

  it('falls back to the raycast hit when no orbit target exists', () => {
    expect(
      resolveAutofocusTarget(
        true,
        null,
        { x: 4, y: 5, z: 6 },
      ),
    ).toEqual({ x: 4, y: 5, z: 6 })
  })
})
