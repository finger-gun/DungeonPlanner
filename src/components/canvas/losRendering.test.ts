import { describe, expect, it } from 'vitest'
import { shouldRenderLineOfSightGeometry, shouldRenderLineOfSightLight } from './losRendering'

describe('shouldRenderLineOfSightGeometry', () => {
  it('renders visible and explored geometry when using the LOS post mask', () => {
    expect(shouldRenderLineOfSightGeometry('visible', true)).toBe(true)
    expect(shouldRenderLineOfSightGeometry('explored', true)).toBe(true)
    expect(shouldRenderLineOfSightGeometry('hidden', true)).toBe(false)
  })

  it('renders all geometry without the LOS post mask', () => {
    expect(shouldRenderLineOfSightGeometry('hidden', false)).toBe(true)
    expect(shouldRenderLineOfSightGeometry('explored', false)).toBe(true)
  })
})

describe('shouldRenderLineOfSightLight', () => {
  it('keeps lights active when the LOS post mask is driving visibility', () => {
    expect(shouldRenderLineOfSightLight('hidden', true)).toBe(true)
  })

  it('otherwise only renders lights for currently visible objects', () => {
    expect(shouldRenderLineOfSightLight('visible', false)).toBe(true)
    expect(shouldRenderLineOfSightLight('hidden', false)).toBe(false)
  })
})
