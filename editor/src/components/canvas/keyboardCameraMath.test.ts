import { describe, expect, it } from 'vitest'
import {
  getKeyboardFrameScale,
  getKeyboardPanAmount,
  getKeyboardRotateAmount,
} from './keyboardCameraMath'

describe('keyboardCameraMath', () => {
  it('matches the old per-frame movement at 60 fps', () => {
    expect(getKeyboardPanAmount(10, 1 / 60)).toBeCloseTo(0.06)
    expect(getKeyboardRotateAmount(1 / 60)).toBeCloseTo(0.025)
  })

  it('keeps the same movement rate per second across different frame times', () => {
    const panAt60Fps = getKeyboardPanAmount(10, 1 / 60) * 60
    const panAt30Fps = getKeyboardPanAmount(10, 1 / 30) * 30

    expect(panAt30Fps).toBeCloseTo(panAt60Fps)
  })

  it('clamps unusually long frames to avoid large camera jumps', () => {
    expect(getKeyboardFrameScale(1)).toBe(2)
    expect(getKeyboardPanAmount(10, 1)).toBeCloseTo(0.12)
    expect(getKeyboardRotateAmount(1)).toBeCloseTo(0.05)
  })
})
