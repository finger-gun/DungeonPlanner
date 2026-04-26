import { describe, expect, it } from 'vitest'
import { getGridOverlayRadius, isPassiveGridMode, shouldRenderGridOverlay } from './gridMode'

describe('gridMode', () => {
  it('uses passive grid behavior in play mode', () => {
    expect(isPassiveGridMode('play', true)).toBe(true)
    expect(shouldRenderGridOverlay(false, true)).toBe(true)
    expect(getGridOverlayRadius('top-down', true)).toBe(10)
  })

  it('preserves existing editor grid behavior outside play mode', () => {
    expect(isPassiveGridMode('move', false)).toBe(true)
    expect(isPassiveGridMode('room', false)).toBe(false)
    expect(shouldRenderGridOverlay(false, false)).toBe(false)
    expect(getGridOverlayRadius('top-down', false)).toBe(10000)
    expect(getGridOverlayRadius('classic', false)).toBe(10000)
    expect(getGridOverlayRadius('perspective', false)).toBe(10)
  })
})
