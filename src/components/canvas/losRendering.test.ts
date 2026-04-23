import { describe, expect, it } from 'vitest'
import { shouldRenderLineOfSightGeometry, shouldRenderLineOfSightLight } from './losRendering'

describe('shouldRenderLineOfSightGeometry', () => {
  it('keeps visible and explored geometry renderable', () => {
    expect(shouldRenderLineOfSightGeometry('visible', true)).toBe(true)
    expect(shouldRenderLineOfSightGeometry('explored', true)).toBe(true)
    expect(shouldRenderLineOfSightGeometry('visible', false)).toBe(true)
    expect(shouldRenderLineOfSightGeometry('explored', false)).toBe(true)
  })

  it('keeps hidden geometry culled', () => {
    expect(shouldRenderLineOfSightGeometry('hidden', true)).toBe(false)
    expect(shouldRenderLineOfSightGeometry('hidden', false)).toBe(false)
  })
})

describe('shouldRenderLineOfSightLight', () => {
  it('only renders lights for currently visible objects', () => {
    expect(shouldRenderLineOfSightLight('visible', true)).toBe(true)
    expect(shouldRenderLineOfSightLight('hidden', true)).toBe(false)
    expect(shouldRenderLineOfSightLight('hidden', false)).toBe(false)
  })
})
