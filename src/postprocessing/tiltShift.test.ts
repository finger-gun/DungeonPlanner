import { describe, expect, it } from 'vitest'
import { depthFocusRangeFromFocalLength, TILT_SHIFT_FOCUS_SAMPLE_XS } from './tiltShiftMath'

describe('tiltShift helpers', () => {
  it('maps focal length controls to a stable depth focus tolerance', () => {
    expect(depthFocusRangeFromFocalLength(0.1)).toBe(0.015)
    expect(depthFocusRangeFromFocalLength(3)).toBeCloseTo(0.1)
    expect(depthFocusRangeFromFocalLength(12)).toBeCloseTo(0.4)
  })

  it('samples focus depth near the center of the frame', () => {
    expect(TILT_SHIFT_FOCUS_SAMPLE_XS).toEqual([0.38, 0.5, 0.62])
  })
})
